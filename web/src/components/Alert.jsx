import React from 'react'

const Alert = ({msg}) => {
  return (
    <div className='px-4 py-2 bg-slate-400 text-white w-fit fixed top-10 right-2/4 z-10 translate-x-2/4 rounded-md transition-all'>{msg}</div>
  )
}

export default Alert