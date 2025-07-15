// Web Worker for heavy processing tasks
import * as ort from 'onnxruntime-web';

let session: ort.InferenceSession | null = null;

self.addEventListener('message', async (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'init':
      try {
        session = await ort.InferenceSession.create(data.modelPath, {
          executionProviders: ['wasm'],
          graphOptimizationLevel: 'all',
        });
        self.postMessage({ type: 'init-complete' });
      } catch (error) {
        self.postMessage({ type: 'error', error: error.message });
      }
      break;
      
    case 'process':
      try {
        if (!session) {
          throw new Error('Model not initialized');
        }
        
        const { inputData, width, height } = data;
        const inputTensor = new ort.Tensor('float32', inputData, [1, 3, height, width]);
        
        const results = await session.run({ input: inputTensor });
        const outputData = results.output.data;
        
        self.postMessage({
          type: 'process-complete',
          data: { outputData, width, height },
        });
      } catch (error) {
        self.postMessage({ type: 'error', error: error.message });
      }
      break;
      
    case 'dispose':
      session?.release();
      session = null;
      self.postMessage({ type: 'dispose-complete' });
      break;
  }
});
