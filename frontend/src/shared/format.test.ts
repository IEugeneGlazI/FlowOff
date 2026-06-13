import { describe, expect, it } from 'vitest';
import { formatCurrency, formatDate } from './format';

describe('Форматирование общих значений', () => {
  it('корректно форматирует денежную сумму в рублях', () => {
    const result = formatCurrency(12500);

    expect(result).toContain('12');
    expect(result).toContain('500');
    expect(result).toMatch(/₽|руб/);
  });

  it('корректно форматирует дату без явного часового пояса', () => {
    const result = formatDate('2026-06-13T10:45:00');

    expect(result).toContain('13');
    expect(result).toMatch(/10:45|13:45|07:45/);
  });

  it('корректно форматирует дату с часовым поясом', () => {
    const result = formatDate('2026-06-13T10:45:00+03:00');

    expect(result).toContain('13');
    expect(result).toMatch(/10:45|07:45/);
  });
});
