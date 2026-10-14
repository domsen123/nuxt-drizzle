export const AUTH_PROVIDER_LABELS: Record<string, string> = {
  credentials: 'Email & Password',
  anonymous: 'Anonymous',
  microsoft: 'Microsoft Entra ID',
}

export const AUTH_PROVIDER_DESCRIPTIONS: Record<string, string> = {
  credentials: 'Standard email and password authentication. Users register and sign in with their credentials.',
  anonymous: 'Allow users to browse without creating an account. Anonymous sessions can be upgraded to full accounts later.',
  microsoft: 'Single sign-on with Microsoft Entra ID (Azure AD). Configure an app registration in the Azure portal and enter its credentials here.',
}
