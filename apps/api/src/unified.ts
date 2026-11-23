export class Unified {
  static ok(data: any, provider?: string) {
    return { success: true, provider: provider || 'soraku', data };
  }

  static fail(message: string, provider?: string) {
    return { success: false, provider: provider || 'soraku', message };
  }
}
