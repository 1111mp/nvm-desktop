import { INSTALL_DIR } from '../../../main/constants';

// Retrieve default `output`
export const getDefaultOutput = async () => INSTALL_DIR;

// Validate `output` option
export const validateOutput = (output: string) => {
  if (typeof output !== 'string') {
    throw new TypeError(`Option "output" must be a string: ${output}`);
  }
};
