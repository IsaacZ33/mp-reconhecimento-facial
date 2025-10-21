import { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js'
import { translateExpressionToEmoji } from './lib/utils';

function traduzirExpressao(expressaoEmIngles: string) {
  const traducoes: { [key: string]: string } = {
    'neutral': 'Neutra',
    'happy': 'Feliz',
    'sad': 'Triste',
    'angry': 'Com Raiva',
    'fearful': 'Com Medo',
    'disgusted': 'Com Nojo',
    'surprised': 'Surpresa'
  };
  return traducoes[expressaoEmIngles] || expressaoEmIngles;
}
function App() {
  // Cria um 'estado' para armazenar a expressão facial detectada (ex: 'happy', 'sad')
  const [expression, setExpression] = useState('')

  // Cria 'referências' para se conectar diretamente aos elementos <video> e <canvas> no HTML
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

 
  // Este useEffect() é executado UMA VEZ quando o componente é montado.
  // Sua única função é pedir permissão e ligar a webcam.
  useEffect(() => {
    // Pede ao navegador permissão para usar o vídeo (webcam)
    navigator.mediaDevices.getUserMedia({ video: true}).then((stream) => {
      // Encontra o elemento <video> que 'linkamos' com o videoRef
      const video = videoRef.current
      if(video){ // Se o <video> foi encontrado...
        video.srcObject = stream // ...define o stream (sinal) da webcam como a fonte do vídeo.
      }
    })
  },[]) // O array vazio [] significa "execute isso apenas uma vez"

  // Este useEffect() também é executado UMA VEZ.
  // Sua função é carregar os "modelos" de inteligência artificial da face-api.
  useEffect(() => {
    // Promise.all() espera todos os modelos serem baixados da pasta /public/models
    Promise.all([
      // Modelo para detectar ONDE está o rosto (um quadrado)
      faceapi.loadTinyFaceDetectorModel('/models'),
      // Modelo para detectar os PONTOS do rosto (olhos, boca, nariz)
      faceapi.loadFaceLandmarkModel('/models'),
      // Modelo para detectar a EXPRESSÃO (feliz, triste, etc.)
      faceapi.loadFaceExpressionModel('/models')
    ]).then(() =>{
      console.log('Modelos da face-api carregados com sucesso!')
    })
   
  }, []) // O array vazio [] significa "execute isso apenas uma vez"



  // Esta é a função PRINCIPAL. Ela é chamada quando o vídeo começa a tocar (onLoadedMetadata)
  // e depois se chama recursivamente (com setTimeout) para criar um 'loop'.
  async function handleLoadedMetadata(){
    // Pega os elementos <video> e <canvas> das referências
    const video = videoRef.current as HTMLVideoElement
    const canvas = canvasRef.current as HTMLCanvasElement

    // Se algum deles ainda não carregou, pare a função aqui.
    if(!video || !canvas) return;

    // A MÁGICA DA API:
    // 1. detectSingleFace: Procura UM rosto no <video> usando o 'TinyFaceDetectorOptions'.
    // 2. withFaceLandmarks: Encontra os pontos (olhos, boca).
    // 3. withFaceExpressions: Tenta adivinhar a expressão.
    const detection = await faceapi.detectSingleFace(video as HTMLVideoElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks().withFaceExpressions()


        if(detection) { // Se um rosto FOI detectado...
          // Pega a expressão com maior probabilidade (ex: 'happy': 0.9, 'sad': 0.1 -> pega 'happy')
          const dominantExpression = detection.expressions.asSortedArray()[0]
          setExpression(dominantExpression.expression) // Salva a 'string' da expressão no estado

          // LÓGICA DE ALINHAMENTO (via API):
          // Isso garante que o canvas tenha as mesmas dimensões do vídeo
          const dimensions = {
            width: video?.offsetWidth,  // Pega a largura ATUAL do vídeo na tela
            height: video?.offsetHeight // Pega a altura ATUAL do vídeo na tela
          }
          // Sincroniza o tamanho do canvas com o tamanho do vídeo
          faceapi.matchDimensions(canvas, dimensions)
          const resizedResults = faceapi.resizeResults(detection, dimensions);


          const context = canvas.getContext('2d');
          if (context) {
            context.clearRect(0, 0, canvas.width, canvas.height);
          }
          faceapi.draw.drawDetections(canvas, resizedResults) 
          faceapi.draw.drawFaceExpressions(canvas, resizedResults)
            faceapi.draw.drawFaceLandmarks(canvas, resizedResults)
  
    }

        setTimeout(handleLoadedMetadata, 1000)
      }
      

  // --- O HTML/JSX que será renderizado na tela ---
  return (
    // Container principal.
    // lg:flex-row -> Em telas grandes, os filhos ficam lado a lado.
    // flex-col -> Em telas pequenas, ficam um em cima do outro.
    // Removido 'container' e 'mx-auto' para alinhar tudo à esquerda.
    <main className="min-h-screen flex flex-col lg:flex-row gap-14 xl:gap-40 p-10 items-center">
      
      {/* Bloco da Câmera (Ficará à esquerda em telas grandes) */}
      <section className="flex flex-col gap-6 flex-1 w-full">
        
        {/* MUDANÇA (CORREÇÃO DE ALINHAMENTO)
          Esta é a "moldura" branca.
        */}
        <div className="bg-purple-700 rounded-xl p-2">
          
          {/* MUDANÇA (CORREÇÃO DE ALINHAMENTO)
            Este é o container que segura o VÍDEO e o CANVAS.
            - 'relative': ESSENCIAL. Diz ao canvas (que será 'absolute') para flutuar sobre este 'div'.
            - 'aspect-video': Força a proporção 16:9 (padrão de webcam).
            - 'w-full': Faz o container usar 100% da largura disponível na <section>.
            - 'rounded-lg overflow-hidden': Arredonda as bordas e 'corta' qualquer
              conteúdo (o vídeo) que tente vazar para fora.
            - 'bg-gray-300': Fundo cinza caso o vídeo demore a carregar.
          */}
          <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-gray-300">
            {/* MUDANÇA (CORREÇÃO DE ALINHAMENTO)
              O VÍDEO.
              - 'w-full' e 'h-full': Faz o vídeo preencher TOTALMENTE o 'div' relative acima.
            */}
            <video 
              onLoadedMetadata={handleLoadedMetadata} // Chama a função da API quando a câmera liga
              autoPlay // Inicia o vídeo automaticamente
                muted    // IMPORTANTE: Adicione 'muted' para o autoPlay funcionar na maioria dos navegadores
              ref={videoRef} // Linka com a referência do React
                className="w-full h-full"
            ></video>
            
            {/* MUDANÇA (CORREÇÃO DE ALINHAMENTO)
              O CANVAS (Leitor de Face).
              - 'absolute inset-0': Faz o canvas flutuar e se esticar para cobrir
                exatamente o 'div' pai (que é 'relative').
              - 'w-full' e 'h-full': Redundante com 'inset-0', mas garante 100% de tamanho.
              - Agora o <canvas> e o <video> têm EXATAMENTE o mesmo tamanho e posição.
            */}
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full"></canvas>
          </div>
        </div>
        
        {/* Bloco que mostra o Emoji/Texto da Expressão */}
        <div
          className={`bg-purple-400 rounded-xl px-8 py-6 flex gap-6 lg:gap-20 items-center h-[200px] justify-center`}
        >
          <p className="text-4xl text-center flex justify-between items-center ">
            <span className='lg:text-[100px] text-6xl'>
              {/* Mostra o emoji correspondente à expressão, se houver uma */}
              {expression && translateExpressionToEmoji(expression)}
            </span>
            {/* Mostra o texto da expressão, se houver uma */}
            <h3>Expressão: {traduzirExpressao(expression)}</h3>
          </p>
        </div>
      </section>

      {/* Bloco do Logo/Slogan (Ficará à direita em telas grandes) */}
      <div className="flex flex-col items-center justify-center">
        {/* Adicione seu logo aqui */}
        {/* (Exemplo) Lembre de colocar seu logo na pasta /public */}
        {/* <img src="/LogoSinout.jpeg" alt="Meu Logo" className="w-48 mb-4" />  */}
        <img src="../LogoSinout2.jpeg" alt="Logo do Sinout" className='w-[400px] mb-4' />
        <h2 style={{ fontFamily: 'Open Sans, sans-serif', fontWeight: '600' }}>Quando o rosto fala, o mundo entende.</h2>
        
      </div>

    </main>
  );
}

export default App;