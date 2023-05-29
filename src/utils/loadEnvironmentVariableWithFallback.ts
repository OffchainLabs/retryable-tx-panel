export const loadEnvironmentVariableWithFallback = ({
  env,
  fallback,
}: {
  env?: string;
  fallback?: string;
}): string => {
  const isValidEnv = (value?: string) => {
    return typeof value === 'string' && value.trim().length !== 0;
  };
  if (isValidEnv(env)) {
    return String(env);
  }
  if (isValidEnv(fallback)) {
    return String(fallback);
  }
  throw new Error(
    `
      Neither the provided value or its fallback are a valid environment variable.
      Expected one of them to be a non-empty string but received env: '${env}', fallback: '${fallback}'.
    `,
  );
};
