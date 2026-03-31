import RNFS from 'react-native-fs';

export const EncodingType = {
  Base64: 'base64',
  UTF8: 'utf8',
} as const;

export const documentDirectory = `${RNFS.DocumentDirectoryPath}/`;
export const cacheDirectory = `${RNFS.CachesDirectoryPath}/`;

const stripFilePrefix = (uri: string) => uri.replace(/^file:\/\//, '');

export async function readAsStringAsync(
  uri: string,
  options?: { encoding?: string }
): Promise<string> {
  const encoding = options?.encoding === EncodingType.Base64 ? 'base64' : 'utf8';
  return RNFS.readFile(stripFilePrefix(uri), encoding);
}

export async function writeAsStringAsync(
  uri: string,
  data: string,
  options?: { encoding?: string }
): Promise<void> {
  const encoding = options?.encoding === EncodingType.Base64 ? 'base64' : 'utf8';
  await RNFS.writeFile(stripFilePrefix(uri), data, encoding);
}

export async function copyAsync(params: { from: string; to: string }): Promise<void> {
  await RNFS.copyFile(stripFilePrefix(params.from), stripFilePrefix(params.to));
}
