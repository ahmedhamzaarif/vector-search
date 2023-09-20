import { useEffect, useRef, useState } from 'react';
import axios from 'axios'
import Loader from './components/Loader';
import Alert from './components/Alert';

const baseUrl = "https://chatbot-smit-jvpp.vercel.app"

function App() {
  const titleInputRef = useRef(null)
  const bodyInputRef = useRef(null)
  const [isLoading, setIsLoading] = useState(false)
  const [alert, setAlert] = useState("")
  const [data, setData] = useState([])
  const searchInputRef = useRef(null)
  
  useEffect(() => {
    if(alert){
      setTimeout(()=>{
        setAlert("")
        console.log("TimeOut!")
      }, 5000)
      console.log("Effect!")
    }
  }, [alert])

  useEffect(() => {
    getAllStories();
  }, []);

  const getAllStories = async () => {
    try {
      setIsLoading(true);
      const resp = await axios.get(`${baseUrl}/api/v1/stories`)
      console.log(resp.data);
      setData(resp.data);

      setIsLoading(false);
    } catch (e) {
      setIsLoading(false);
      console.log(e.message);
      setAlert(e.message)
    }

  }

  const postStory = async (e)=>{
    e.preventDefault()

    try{
      setIsLoading(true)
      const response = await axios.post(`${baseUrl}/api/v1/story`, {
        title: titleInputRef.current.value,
        text: bodyInputRef.current.value,
      })

      console.log('response: ', response.data)
      setIsLoading(false)
      getAllStories()
      setAlert(response?.data?.message)
      e.target.reset()
      console.log(data)
    } catch (e){
      setIsLoading(false)
      console.log(e)
    }
  }
  const deleteStory = async (id)=>{
    try{
      setIsLoading(true)
      const response = await axios.delete(`${baseUrl}/api/v1/story/${id}`)
      console.log("response: ", response.data)
      setIsLoading(false)
      setAlert(response?.data?.message)
      getAllStories()
    }catch(e){
      console.log(e.message)
    }
  }
  const updateStory = async (e, id)=>{
    e.preventDefault()
    try{
      setIsLoading(true)
      const response = await axios.put(`${baseUrl}/api/v1/story/${id}`, {
        title: e.target.titleInput.value,
        text: e.target.bodyInput.value
      })
      console.log("response: ", response.data)
      setIsLoading(false)
      getAllStories()
      setAlert(response?.data?.message)

    } catch(e){
      setIsLoading(false)
      console.log(e.message)
    }
    
  } 
  const searchStories = async (e)=>{
    e.preventDefault()
    try{
      setIsLoading(true)
      const resp = await axios.get(`${baseUrl}/api/v1/search?q=${searchInputRef.current.value}`)
      console.log(resp.data)
      setData(resp.data);
      setIsLoading(false)
    } catch(e){
      setIsLoading(false)
      console.log(e.message)
    }
  }
  return (
    <div className='md:w-2/5 mx-auto p-4'>
      <h1 className='text-center text-5xl mb-5 font-bold'>Social Stories</h1>


      {/* New Stories */}
      <form onSubmit={postStory} className='mb-5'>
        <label htmlFor="titleInput" className='w-full'>Title: </label>
        <input type="text" id="titleInput" maxLength={20} minLength={2} required ref={titleInputRef} className='w-full bg-gray-100 border-transparent focus:border-0 mb-5 rounded-md p-2 focus-visible:outline-none focus-visible:bg-gray-200'/>
        <label htmlFor="bodyInput" className='w-full'>What's on your mind: </label>
        <textarea type="text" id="bodyInput" rows="3" maxLength={999} minLength={10} required ref={bodyInputRef} className='p-2 bg-gray-100 rounded-md w-full mb-5 focus-visible:outline-none focus-visible:bg-gray-200'></textarea>
        <button type="submit" className='bg-violet-500 rounded-md px-4 py-2 text-white font-semibold'>Post</button>
      </form>

      {/* Search Stories */}
      <form onSubmit={searchStories} className='mb-10'>
        <input type="search" id='searchInput' ref={searchInputRef} placeholder='Search' className='bg-slate-100 p-2 rounded-md w-80 focus-visible:outline-none focus-visible:bg-gray-200 w-full'/>
        <button type='submit' hidden>Search</button>
      </form>

      {alert && <Alert msg={alert}/>}
      {isLoading ? <Loader/> : ''}
    
      <div>
        {data.map((eachStory, i)=>(
          <div className='card p-5' key={i}>
            { 
              eachStory.isEdit ? (
                <>
                  <form onSubmit={(e)=>{updateStory(e, eachStory?._id)}} className='w-3/4 mx-auto'>
                    <label htmlFor="titleInput" className='w-full'>Title: </label>
                    <input type="text" id="titleInput" name="titleInput" maxLength={20} minLength={2} required defaultValue={eachStory?.title} className='w-full bg-gray-100 border-transparent mb-5 rounded-md p-2 focus-visible:outline-none focus-visible:bg-gray-200'/>
                    <label htmlFor="bodyInput" className='w-full'>What's on your mind: </label>
                    <textarea type="text" id="bodyInput" name='bodyInput' rows="3" maxLength={999} minLength={10} required defaultValue={eachStory?.text} className='p-2 bg-gray-100 rounded-md w-full mb-5  focus-visible:outline-none focus-visible:bg-gray-200'></textarea>
                    <div className="flex gap-x-2">
                      <button type="submit" className='bg-violet-500 rounded-md px-4 py-2 font-semibold text-white'>Edit</button>
                      <button onClick={()=>{
                        eachStory.isEdit = false;
                        setData([...data])
                      }} className='border border-1 border-violet-500 text-violet-500 font-semibold rounded-md px-4 py-2'>Cancel</button>
                    </div>

                  </form>
                </>
               ) : 
               (
                // Simple Card */
                <>
                  <select className='bg-slate-100 text-sm py-2 px-4 border-0 rounded-md float-right'>
                    <option>...</option>
                    <option onClick={()=>{deleteStory(eachStory?._id)}}>Delete</option>
                    <option onClick={() => {
                        eachStory.isEdit = true;
                        console.log(eachStory.isEdit)
                        setData([...data]);
                      }}>Edit </option>
                  </select>
                  <h2> {eachStory?.title} </h2>
                  <p>{eachStory?.text}</p>
                </>

            )
               }
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
