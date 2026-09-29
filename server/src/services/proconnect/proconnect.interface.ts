export interface ProconnectStudentProfile {
  studentId: string;
  name: string;
  mobile: string;
  email: string;
}

export interface IProconnectService {
  /**
   * Exchanges an opaque, single-use authorization code for the authenticated student profile.
   * Throws ApiError if code is invalid, expired, or already used.
   */
  exchangeCode(code: string): Promise<ProconnectStudentProfile>;

  /**
   * Optional helper (primarily for mock/dev) to generate a simulated authorization code.
   */
  generateMockCode?(profile?: Partial<ProconnectStudentProfile>): Promise<string>;
}
