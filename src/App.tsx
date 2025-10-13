import { useEffect, useRef, useState } from 'react';
import Header from './components/Header';
import LoadingSpinner from './components/LoadingSpinner';
import * as faceapi from 'face-api.js'
import { translateExpressionToEmoji } from './lib/utils';
function App() {
  const [expression, setExpression] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true}).then((stream) => {
      const video = videoRef.current
      if(video){
        video.srcObject = stream

      }
    })
  },[])

  useEffect(() => {
    Promise.all([
      faceapi.loadTinyFaceDetectorModel('/models'),
      faceapi.loadFaceLandmarkModel('/models'),
      faceapi.loadFaceExpressionModel('/models')
    ]).then(() =>{
      console.log('Models loaded')
    })
    
  }, [])



    async function handleLoadedMetadata(){

      const video = videoRef.current as HTMLVideoElement
    const canvas = canvasRef.current as HTMLCanvasElement
    if(!video || !canvas) return;

      const detection = await faceapi.detectSingleFace(video as HTMLVideoElement, new faceapi.TinyFaceDetectorOptions()
    ).withFaceLandmarks().withFaceExpressions()




      

      if(detection) {
        const dominantExpression = detection.expressions.asSortedArray()[0]
        setExpression(dominantExpression.expression)

        const dimensions = {
        width: video?.offsetWidth,
        height: video?.offsetHeight
      }
        faceapi.matchDimensions(canvas, dimensions)
        const resizedResults = faceapi.resizeResults(detection, dimensions);
        faceapi.draw.drawDetections(canvas, resizedResults)
        faceapi.draw.drawFaceLandmarks(canvas, resizedResults)
        faceapi.draw.drawFaceExpressions(canvas, resizedResults)
  }
      setTimeout(handleLoadedMetadata, 1000)
    }
    

  return (
    <main className="min-h-screen flex flex-col lg:flex-row md:justify-between gap-14 xl:gap-40 p-10 items-center container mx-auto">
      <Header />
      <section className="flex flex-col gap-6 flex-1 w-full">
        <div className="bg-white rounded-xl p-2">
          <div className="relative flex items-center justify-center aspect-video w-full">
            {/* Substitua pela Webcam */}
            <div className="aspect-video rounded-lg bg-gray-300 w-full">
              <div className='relative'>
                <video 
                onLoadedMetadata={handleLoadedMetadata}
                autoPlay 
                ref={videoRef}></video>
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full"></canvas>
              </div>
              
            </div>
            {/* Substitua pela Webcam */}
          </div>
        </div>
        <div
          className={`bg-white rounded-xl px-8 py-6 flex gap-6 lg:gap-20 items-center h-[200px] justify-center`}
        >
          <p className="text-4xl text-center flex justify-between items-center ">
            <span className='lg:text-[100px] text-6xl'>
              {expression && translateExpressionToEmoji(expression)}
            </span>
            <h3>Expressão: {expression}</h3>
          </p>
        </div>
      </section>
    </main>
  );
}

export default App;
