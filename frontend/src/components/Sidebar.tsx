import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getChats } from "../lib/api";

interface Chat {
  id: string;
  title?: string;
}

interface ChatsResponse {
  chats: Chat[];
}

export default function Sidebar() {
  const p = useLocation().pathname
  const [isToggled, setIsToggled] = useState(false)
  const [chats, setChats] = useState<ChatsResponse | null>(null);

  useEffect(() => {
    getChats().then(data => setChats(data));
  }, []);

  const b = (t: string) => `p-2 rounded-xl duration-300 transition-all ${p === t ? 'text-white bg-stone-800' : 'hover:bg-stone-900 hover:text-stone-200'}`
  const chatButtonClass = `p-2 rounded-xl duration-300 transition-all ${isToggled ? 'text-white bg-stone-800' : 'hover:bg-stone-900 hover:text-stone-200'}`
  function toggleC() {
    const idk = document.getElementById("idk")
    idk?.classList.toggle("flex");
    idk?.classList.toggle("hidden");
    document.getElementById("idk0")?.classList.toggle("md:rounded-r-none")
    setIsToggled(!isToggled)
  }

  return (
    <aside className='left-0 bottom-0 w-screen md:w-fit md:h-screen fixed p-4 z-50 lg:flex'>
      <div id='idk' className='w-64 md:order-2 h-full z-40 rounded-l-none rounded-2xl bg-stone-950 border border-l-transparent border-stone-900 hidden flex-col p-4 space-y-3 overflow-y-auto custom-scroll'>
        {chats?.chats.map((chat) => (
          <Link key={chat.id} to={`/chat/?chatId=${chat.id}`} className='p-2 hover:text-stone-200 hover:bg-stone-900 w-full rounded-xl block text-sm min-h-fit truncate'>
            {chat.title || 'Untitled Chat'}
          </Link>
        ))}
      </div>
      <div id='idk0' className='md:w-20 md:order-1 h-full rounded-3xl bg-stone-950/50 backdrop-blur-xl border border-stone-900 text-stone-400 flex flex-col items-center justify-between py-4'>
        <img src='/logo.png' alt='logo' className='w-10 h-auto rounded-full hidden md:block' />
        <nav className='flex md:flex-col items-center space-x-4 md:space-x-0 md:space-y-2 my-auto'>
          <Link to='/' className={b('/')}>
            <svg className="size-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M6.29367 4.96556C3.62685 6.90311 2.29344 7.87189 1.76974 9.30291C1.72773 9.41771 1.68994 9.534 1.65645 9.65157C1.23901 11.1171 1.74832 12.6846 2.76696 15.8197C3.78559 18.9547 4.2949 20.5222 5.49405 21.4625C5.59025 21.5379 5.68918 21.6098 5.79064 21.678C7.05546 22.5279 8.70364 22.5279 12 22.5279C15.2964 22.5279 16.9446 22.5279 18.2094 21.678C18.3108 21.6098 18.4098 21.5379 18.506 21.4625C19.7051 20.5222 20.2144 18.9547 21.2331 15.8197C22.2517 12.6846 22.761 11.1171 22.3436 9.65157C22.3101 9.534 22.2723 9.41771 22.2303 9.30291C21.7066 7.87189 20.3732 6.90312 17.7064 4.96557C15.0395 3.02801 13.7061 2.05923 12.1833 2.00336C12.0611 1.99888 11.9389 1.99888 11.8167 2.00336C10.2939 2.05923 8.96048 3.02801 6.29367 4.96556ZM10 17.0697C9.58579 17.0697 9.25 17.4054 9.25 17.8197C9.25 18.2339 9.58579 18.5697 10 18.5697H14C14.4142 18.5697 14.75 18.2339 14.75 17.8197C14.75 17.4054 14.4142 17.0697 14 17.0697H10Z" fill="currentColor" /></svg>
          </Link>
          <button onClick={() => toggleC()} className={chatButtonClass}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 1.25C6.06294 1.25 1.25 6.06294 1.25 12C1.25 17.9371 6.06294 22.75 12 22.75C17.9371 22.75 22.75 17.9371 22.75 12C22.75 6.06294 17.9371 1.25 12 1.25ZM12.75 8C12.75 7.58579 12.4142 7.25 12 7.25C11.5858 7.25 11.25 7.58579 11.25 8L11.25 11.5C11.25 12.7426 12.2574 13.75 13.5 13.75H15C15.4142 13.75 15.75 13.4142 15.75 13C15.75 12.5858 15.4142 12.25 15 12.25H13.5C13.0858 12.25 12.75 11.9142 12.75 11.5L12.75 8Z" fill="currentColor" /></svg>
          </button>
          <Link to='/slides' className={b('/slides')} title="Slides">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 5C4 3.34315 5.34315 2 7 2H17C18.6569 2 20 3.34315 20 5V15C20 16.6569 18.6569 18 17 18H7C5.34315 18 4 16.6569 4 15V5Z" stroke="currentColor" strokeWidth="2"/>
              <path d="M8 22H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M12 18V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </Link>
        </nav>
      </div>
    </aside>
  )
}
