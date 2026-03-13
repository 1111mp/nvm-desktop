import { z } from 'zod';
import { createErrorMap } from 'zod-validation-error';

z.config({
  customError: createErrorMap(),
});

export { z };
