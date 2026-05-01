const { generatePassword } = require('../src/utils/password');
const { compareDescriptors, isValidDescriptor } = require('../src/utils/face');

describe('password generator', () => {
  it('produces unique strong passwords', () => {
    const a = generatePassword(14);
    const b = generatePassword(14);
    expect(a).toHaveLength(14);
    expect(a).not.toBe(b);
    expect(a).toMatch(/[A-Z]/);
    expect(a).toMatch(/[a-z]/);
    expect(a).toMatch(/\d/);
  });
});

describe('face descriptor', () => {
  it('matches when descriptors are identical', () => {
    const d = Array.from({ length: 128 }, (_, i) => (i % 10) / 10);
    expect(isValidDescriptor(d)).toBe(true);
    const r = compareDescriptors(d, d, 0.5);
    expect(r.matched).toBe(true);
    expect(r.distance).toBe(0);
  });

  it('fails when descriptors differ significantly', () => {
    const a = Array.from({ length: 128 }, () => 0);
    const b = Array.from({ length: 128 }, () => 1);
    const r = compareDescriptors(a, b, 0.5);
    expect(r.matched).toBe(false);
  });
});
