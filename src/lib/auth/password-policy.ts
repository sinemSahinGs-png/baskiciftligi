export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;

const SPECIAL = /[^0-9A-Za-zÀ-ÿĞğİıÖöŞşÜü]/;

export interface PasswordPolicyResult {
  ok: boolean;
  errors: string[];
}

export function evaluatePasswordPolicy(
  password: string,
  options?: { email?: string },
): PasswordPolicyResult {
  const errors: string[] = [];

  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`Şifre en az ${PASSWORD_MIN_LENGTH} karakter olmalıdır.`);
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    errors.push(`Şifre en fazla ${PASSWORD_MAX_LENGTH} karakter olabilir.`);
  }
  if (!/[a-zğüşıöç]/.test(password)) {
    errors.push("Şifre en az bir küçük harf içermelidir.");
  }
  if (!/[A-ZĞÜŞİÖÇ]/.test(password)) {
    errors.push("Şifre en az bir büyük harf içermelidir.");
  }
  if (!/\d/.test(password)) {
    errors.push("Şifre en az bir rakam içermelidir.");
  }
  if (!SPECIAL.test(password)) {
    errors.push("Şifre en az bir özel karakter içermelidir.");
  }

  const localPart = options?.email?.split("@")[0]?.trim();
  if (localPart && localPart.length >= 3) {
    const haystack = password.toLocaleLowerCase("tr-TR");
    if (haystack.includes(localPart.toLocaleLowerCase("tr-TR"))) {
      errors.push("Şifre e-posta adresinizin bir parçasını içeremez.");
    }
  }

  return { ok: errors.length === 0, errors };
}
