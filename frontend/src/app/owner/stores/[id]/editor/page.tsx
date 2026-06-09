import EditorClient from './EditorClient';

// Editor visual de tienda — /owner/stores/[id]/editor
export default async function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditorClient storeId={id} />;
}
