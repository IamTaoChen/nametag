type PersonNames = {
  name: string;
  surname?: string | null;
  middleName?: string | null;
  secondLastName?: string | null;
  nickname?: string | null;
};
/**
 * Formats a person's name with optional nickname and all name parts
 * Format: "Name 'Nickname' MiddleName Surname SecondLastName"
 * Examples:
 * - "John Smith" (no nickname, no middle names)
 * - "Charles 'Charlie' Brown" (with nickname)
 * - "John" (only name)
 * - "Matias Alejandro Godoy Biedma" (with middle name and second last name)
 */
export function formatPersonName(
  person: PersonNames,
  nameFormat?: string | null,
): string {
  const formatToUse = nameFormat ?? getGlobalPersonFormat();
  if (formatToUse) {
    return formatToUse
      .replaceAll('{name}', person.name)
      .replaceAll('{nickname}', person.nickname || '')
      .replaceAll('{middleName}', person.middleName || '')
      .replaceAll('{surname}', person.surname || '')
      .replaceAll('{secondLastName}', person.secondLastName || '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  const parts: string[] = [person.name];
  if (person.nickname) {
    parts.push(`'${person.nickname}'`);
  }
  if (person.middleName) {
    parts.push(person.middleName);
  }
  if (person.surname) {
    parts.push(person.surname);
  }
  if (person.secondLastName) {
    parts.push(person.secondLastName);
  }

  return parts.join(' ');
}

/**
 * Formats a person's full name for display
 * Same as formatPersonName but with a person object
 */
function getGlobalFullnameFormat(): string | null {
  // In Next.js client bundles, this value is injected from next.config.ts env.
  return process.env.FULLNAME_FORMAT || null;
}

function getGlobalGraphNameFormat(): string | null {
  // In Next.js client bundles, this value is injected from next.config.ts env.
  const format = process.env.GRAPHNAME_FORMAT;
  return format && format.trim() ? format : null;
}

function getGlobalPersonFormat(): string | null {
  // In Next.js client bundles, this value is injected from next.config.ts env.
  const format = process.env.PERSON_FORMAT;
  if (format && format.trim()) {
    return format;
  }
  return null;
}

export function formatFullName(
  person: PersonNames & { nameFormat?: string | null },
  nameFormat?: string | null,
): string {
  return formatPersonName(
    person,
    nameFormat ?? person.nameFormat ?? getGlobalFullnameFormat(),
  );
}

/**
 * Formats a person's name for display in network graphs
 * Shows only nickname (if present) or first name, plus surname
 * This keeps graph node labels concise and readable
 * Examples:
 * - "Matias Alejandro Godoy Biedma" → "Matias Godoy"
 * - "Matias 'Matto' Alejandro Godoy Biedma" → "Matto Godoy"
 * - "John" → "John"
 */
export function formatGraphName(person: {
  name: string;
  surname?: string | null;
  nickname?: string | null;
}): string {
  const graphNameFormat = getGlobalGraphNameFormat();
  if (graphNameFormat) {
    return graphNameFormat
      .replaceAll('{name}', person.name)
      .replaceAll('{surname}', person.surname || '')
      .replaceAll('{nickname}', person.nickname || '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  const displayName = person.nickname || person.name;
  return person.surname ? `${displayName} ${person.surname}` : displayName;
}
