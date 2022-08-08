import { useEffect, useState } from "react";

const baseUrl = process.env.REACT_APP_API_URL ?? ''

function App() {
  const [allPhotos, setAllPhotos] = useState<{filename: string, url: string}[]>([])
  useEffect(() => {
    const fetchPhotos = async (url: string) => {
      const res = await fetch(url)
      const json = await res.json()
      setAllPhotos(json)
      return json
    }
    fetchPhotos(`${baseUrl}/getallphotos`)
  }, [])
  return (
    <div className="App">
      {allPhotos.length > 0 && allPhotos.map(photo => (
        <>
          <img src={`${photo.url}`} alt={`${photo.filename}`} />
          <p>{photo.filename.split('.').shift()}</p>
        </>
      ))}
    </div>
  );
}

export default App;
