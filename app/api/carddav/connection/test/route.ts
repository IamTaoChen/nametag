import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createDAVClient } from 'tsdav';
import { validateServerUrl } from '@/lib/carddav/url-validation';
import { checkRateLimit } from '@/lib/rate-limit';
import { createModuleLogger } from '@/lib/logger';
import { withLogging } from '@/lib/api-utils';
import { z } from 'zod';

const log = createModuleLogger('carddav');

const connectionTestSchema = z.object({
  serverUrl: z.string().url(),
  username: z.string().min(1),
  password: z.string().min(1),
});

export const POST = withLogging(async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimitResponse = checkRateLimit(request, 'carddavTest', session.user.id);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    const validationResult = connectionTestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { serverUrl, username, password } = validationResult.data;

    // Validate URL to prevent SSRF attacks
    try {
      await validateServerUrl(serverUrl);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Invalid server URL' },
        { status: 400 }
      );
    }

    // Test connection using tsdav
    try {
      const client = await createDAVClient({
        serverUrl,
        credentials: {
          username,
          password,
        },
        authMethod: 'Basic',
        defaultAccountType: 'carddav',
      });

      // Fetch address books to verify connection AND return the list.
      // Pass custom props to include addressbook-description, which tsdav
      // doesn't request by default.
      const addressBooks = await client.fetchAddressBooks({
        props: {
          'd:displayname': {},
          'cs:getctag': {},
          'd:resourcetype': {},
          'd:sync-token': {},
          'card:addressbook-description': {},
        },
      });

      // Count contacts per address book in parallel using lightweight PROPFIND
      // (requests only getetag, no vCard data downloaded)
      const addressBooksWithCounts = await Promise.all(
        addressBooks.map(async (ab) => {
          const absoluteUrl = /^https?:\/\//i.test(ab.url) ? ab.url : new URL(ab.url, serverUrl).href;
          let contactCount: number | null = null;
          try {
            const resources = await client.propfind({
              url: absoluteUrl,
              props: { 'd:getetag': {} },
              depth: '1',
            });
            // First response is the collection itself; the rest are vCard resources
            contactCount = Math.max(0, resources.length - 1);
          } catch (err) {
            log.warn({ err: err instanceof Error ? err : new Error(String(err)), url: absoluteUrl }, 'Failed to count contacts in address book');
          }
          return {
            url: absoluteUrl,
            displayName: typeof ab.displayName === 'string' ? ab.displayName : null,
            description: ab.description || null,
            contactCount,
          };
        })
      );

      return NextResponse.json({
        success: true,
        message: 'Connection successful',
        addressBooks: addressBooksWithCounts,
      });
    } catch (error) {
      log.error({ err: error instanceof Error ? error : new Error(String(error)) }, 'CardDAV connection test failed');

      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('unauthorized')) {
          return NextResponse.json(
            { error: 'Authentication failed. Please check your username and password.' },
            { status: 401 }
          );
        }
        if (error.message.includes('404') || error.message.includes('not found')) {
          return NextResponse.json(
            { error: 'Server not found. Please check the server URL.' },
            { status: 404 }
          );
        }
        if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
          return NextResponse.json(
            { error: 'Connection timeout. Please check the server URL and your network.' },
            { status: 408 }
          );
        }
      }

      return NextResponse.json(
        { error: 'Failed to connect to CardDAV server. Please check your settings.' },
        { status: 500 }
      );
    }
  } catch (error) {
    log.error({ err: error instanceof Error ? error : new Error(String(error)) }, 'Error testing CardDAV connection');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
