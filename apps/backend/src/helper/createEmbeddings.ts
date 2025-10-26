import {embed} from 'ai';
import { google } from '@ai-sdk/google';

const model = 'text-embedding-004';

export async function createEmbeddings(text: string) {
    const embeddings = await embed({
        model: google.textEmbedding(model),
        value: text,
    });
    return embeddings;
}