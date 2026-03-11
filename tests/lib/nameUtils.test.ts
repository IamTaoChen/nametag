import { describe, it, expect } from 'vitest';
import {
  formatPersonName,
  formatFullName,
  formatGraphName,
} from '@/lib/nameUtils';

describe('nameUtils', () => {
  describe('formatPersonName', () => {
    it('should support object args style', () => {
      expect(formatPersonName({ name: 'John', surname: 'Smith' })).toBe(
        'John Smith',
      );
    });

    it('should support object args style with custom format override', () => {
      expect(
        formatPersonName(
          { name: 'John', surname: 'Smith', nickname: 'Johnny' },
          '{surname}, {name} ({nickname})',
        ),
      ).toBe('Smith, John (Johnny)');
    });

    it('should use PERSON_FORMAT when no nameFormat is provided', () => {
      process.env.PERSON_FORMAT = '{surname}, {name}';
      expect(formatPersonName({ name: 'John', surname: 'Smith' })).toBe('Smith, John',);
      delete process.env.PERSON_FORMAT;
    });

    it('should fallback to FULLNAME_FORMAT when PERSON_FORMAT is empty', () => {
      process.env.PERSON_FORMAT = '';
      process.env.FULLNAME_FORMAT = '{surname}, {name}';
      try {
        expect(formatPersonName({ name: 'John', surname: 'Smith' })).toBe('John Smith',);
      } finally {
        delete process.env.PERSON_FORMAT;
        delete process.env.FULLNAME_FORMAT;
      }
    });

    it('should format name only', () => {
      expect(formatPersonName({ name: 'John' })).toBe('John');
    });

    it('should format name and surname', () => {
      expect(formatPersonName({ name: 'John', surname: 'Smith' })).toBe('John Smith',);
    });

    it('should format name with nickname', () => {
      expect(formatPersonName({ name: 'Charles', nickname: 'Charlie' })).toBe("Charles 'Charlie'",);
    });

    it('should format name, nickname, and surname', () => {
      expect(
        formatPersonName({
          name: 'Charles',
          surname: 'Brown',
          nickname: 'Charlie',
        }),
      ).toBe("Charles 'Charlie' Brown");
    });

    it('should handle null surname', () => {
      expect(formatPersonName({ name: 'John', surname: null })).toBe('John');
    });

    it('should handle undefined surname', () => {
      expect(formatPersonName({ name: 'John', surname: undefined })).toBe(
        'John',
      );
    });

    it('should handle null nickname', () => {
      expect(
        formatPersonName({
          name: 'John',
          surname: 'Smith',
          middleName: null,
          secondLastName: null,
          nickname: null,
        }),
      ).toBe('John Smith');
    });

    it('should handle undefined nickname', () => {
      expect(
        formatPersonName({
          name: 'John',
          surname: 'Smith',
          middleName: undefined,
          secondLastName: undefined,
          nickname: undefined,
        }),
      ).toBe('John Smith');
    });

    it('should handle all null/undefined optional params', () => {
      expect(
        formatPersonName({ name: 'John', surname: null, middleName: null }),
      ).toBe('John');
      expect(
        formatPersonName({
          name: 'John',
          surname: undefined,
          middleName: undefined,
        }),
      ).toBe('John');
    });

    it('should handle names with special characters', () => {
      expect(
        formatPersonName({
          name: 'Mary-Jane',
          surname: "O'Connor",
          middleName: null,
          secondLastName: null,
          nickname: 'MJ',
        }),
      ).toBe("Mary-Jane 'MJ' O'Connor");
    });

    it('should handle unicode names', () => {
      expect(
        formatPersonName({
          name: 'José',
          surname: 'García',
          middleName: null,
          secondLastName: null,
          nickname: 'Pepe',
        }),
      ).toBe("José 'Pepe' García");
    });

    it('should format name with middle name', () => {
      expect(
        formatPersonName({
          name: 'John',
          surname: 'Doe',
          middleName: 'Michael',
        }),
      ).toBe('John Michael Doe');
    });

    it('should format name with second last name', () => {
      expect(
        formatPersonName({
          name: 'Jane',
          surname: 'Smith',
          middleName: null,
          secondLastName: 'Johnson',
        }),
      ).toBe('Jane Smith Johnson');
    });

    it('should format name with middle name and second last name', () => {
      expect(
        formatPersonName({
          name: 'Matias',
          surname: 'Godoy',
          middleName: 'Alejandro',
          secondLastName: 'Biedma',
        }),
      ).toBe('Matias Alejandro Godoy Biedma');
    });

    it('should format complete name with nickname, middle name, and second last name', () => {
      expect(
        formatPersonName({
          name: 'Matias',
          surname: 'Godoy',
          middleName: 'Alejandro',
          secondLastName: 'Biedma',
          nickname: 'Matto',
        }),
      ).toBe("Matias 'Matto' Alejandro Godoy Biedma");
    });

    it('should handle null middle name and second last name', () => {
      expect(
        formatPersonName({
          name: 'John',
          surname: 'Doe',
          middleName: null,
          secondLastName: null,
        }),
      ).toBe('John Doe');
    });

    it('should handle undefined middle name and second last name', () => {
      expect(
        formatPersonName({
          name: 'John',
          surname: 'Doe',
          middleName: undefined,
          secondLastName: undefined,
        }),
      ).toBe('John Doe');
    });
  });

  describe('formatFullName', () => {
    it('should use FULLNAME_FORMAT when person.nameFormat is not provided', () => {
      process.env.FULLNAME_FORMAT = '{surname}, {name}';
      const person = { name: 'John', surname: 'Doe' };
      expect(formatFullName(person)).toBe('Doe, John');
      delete process.env.FULLNAME_FORMAT;
    });

    it('should prioritize person.nameFormat over FULLNAME_FORMAT', () => {
      process.env.FULLNAME_FORMAT = '{surname}, {name}';
      const person = {
        name: 'John',
        surname: 'Doe',
        nameFormat: '{name} ({surname})',
      };
      expect(formatFullName(person)).toBe('John (Doe)');
      delete process.env.FULLNAME_FORMAT;
    });

    it('should format person object with all fields', () => {
      const person = { name: 'John', surname: 'Doe', nickname: 'Johnny' };
      expect(formatFullName(person)).toBe("John 'Johnny' Doe");
    });

    it('should format person object with only name', () => {
      const person = { name: 'John' };
      expect(formatFullName(person)).toBe('John');
    });

    it('should format person object with name and surname', () => {
      const person = { name: 'John', surname: 'Doe' };
      expect(formatFullName(person)).toBe('John Doe');
    });

    it('should format person object with name and nickname', () => {
      const person = { name: 'John', nickname: 'Johnny' };
      expect(formatFullName(person)).toBe("John 'Johnny'");
    });

    it('should handle null values in person object', () => {
      const person = { name: 'John', surname: null, nickname: null };
      expect(formatFullName(person)).toBe('John');
    });

    it('should format person with middle name', () => {
      const person = { name: 'John', surname: 'Doe', middleName: 'Michael' };
      expect(formatFullName(person)).toBe('John Michael Doe');
    });

    it('should format person with second last name', () => {
      const person = {
        name: 'Jane',
        surname: 'Smith',
        secondLastName: 'Johnson',
      };
      expect(formatFullName(person)).toBe('Jane Smith Johnson');
    });

    it('should format person with all name fields', () => {
      const person = {
        name: 'Matias',
        surname: 'Godoy',
        middleName: 'Alejandro',
        secondLastName: 'Biedma',
        nickname: 'Matto',
      };
      expect(formatFullName(person)).toBe(
        "Matias 'Matto' Alejandro Godoy Biedma",
      );
    });
  });

  describe('formatGraphName', () => {
    it('should use GRAPHNAME_FORMAT for graph labels', () => {
      process.env.GRAPHNAME_FORMAT = '{surname}, {name}';
      const person = { name: 'John', surname: 'Doe' };
      expect(formatGraphName(person)).toBe('Doe, John');
      delete process.env.GRAPHNAME_FORMAT;
    });

    it('should allow nickname placeholder in GRAPHNAME_FORMAT', () => {
      process.env.GRAPHNAME_FORMAT = '{surname}, {nickname}';
      const person = { name: 'Matias', surname: 'Godoy', nickname: 'Matto' };
      expect(formatGraphName(person)).toBe('Godoy, Matto');
      delete process.env.GRAPHNAME_FORMAT;
    });

    it('should fallback to default logic when GRAPHNAME_FORMAT is empty', () => {
      process.env.GRAPHNAME_FORMAT = '';
      const person = { name: 'Matias', surname: 'Godoy', nickname: 'Matto' };
      expect(formatGraphName(person)).toBe('Matto Godoy');
      delete process.env.GRAPHNAME_FORMAT;
    });

    it('should format name only', () => {
      const person = { name: 'John' };
      expect(formatGraphName(person)).toBe('John');
    });

    it('should format name and surname', () => {
      const person = { name: 'John', surname: 'Doe' };
      expect(formatGraphName(person)).toBe('John Doe');
    });

    it('should use nickname instead of name when present', () => {
      const person = { name: 'Matias', surname: 'Godoy', nickname: 'Matto' };
      expect(formatGraphName(person)).toBe('Matto Godoy');
    });

    it('should show only first name and surname (ignore middle names)', () => {
      const person = {
        name: 'Matias',
        surname: 'Godoy',
        middleName: 'Alejandro',
        secondLastName: 'Biedma',
      };
      expect(formatGraphName(person)).toBe('Matias Godoy');
    });

    it('should use nickname with surname (ignore middle names)', () => {
      const person = {
        name: 'Matias',
        surname: 'Godoy',
        middleName: 'Alejandro',
        secondLastName: 'Biedma',
        nickname: 'Matto',
      };
      expect(formatGraphName(person)).toBe('Matto Godoy');
    });

    it('should handle null surname', () => {
      const person = { name: 'John', surname: null };
      expect(formatGraphName(person)).toBe('John');
    });

    it('should handle nickname without surname', () => {
      const person = { name: 'John', surname: null, nickname: 'Johnny' };
      expect(formatGraphName(person)).toBe('Johnny');
    });
  });
});
