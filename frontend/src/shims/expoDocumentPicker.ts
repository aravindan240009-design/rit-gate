import DocumentPicker from 'react-native-document-picker';

type PickOptions = {
  type?: string[];
  copyToCacheDirectory?: boolean;
  multiple?: boolean;
};

export async function getDocumentAsync(options: PickOptions = {}) {
  try {
    const file = await DocumentPicker.pickSingle({
      type: options.type ?? [DocumentPicker.types.allFiles],
      copyTo: options.copyToCacheDirectory ? 'cachesDirectory' : 'documentDirectory',
      presentationStyle: 'fullScreen',
    });

    return {
      canceled: false,
      assets: [
        {
          uri: file.fileCopyUri || file.uri,
          name: file.name || 'attachment',
          mimeType: file.type || undefined,
          size: file.size,
        },
      ],
    };
  } catch (error) {
    if (DocumentPicker.isCancel(error)) {
      return { canceled: true, assets: [] };
    }
    throw error;
  }
}
