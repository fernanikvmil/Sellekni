export default function SendButton({ onClick, disabled, loading }) {
  return (
    <div className="group relative flex justify-center">
      <button onClick={onClick} disabled={disabled} className={`transition-opacity duration-200 ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}>
        {loading ? (
          <span className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full inline-block animate-spin" />
        ) : (
          <svg strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" height={44} width={44} xmlns="http://www.w3.org/2000/svg" className="w-8 hover:scale-125 duration-200 hover:stroke-violet-400" fill="none">
            <path fill="none" d="M0 0h24v24H0z" stroke="none" />
            <path d="M8 9h8" />
            <path d="M8 13h6" />
            <path d="M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-5l-5 3v-3h-2a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12z" />
          </svg>
        )}
      </button>
      {!loading && (
        <span className="absolute -top-14 left-[50%] -translate-x-[50%] z-20 origin-left scale-0 px-3 rounded-lg border border-white/10 bg-[#0F1E65] py-2 text-sm font-bold shadow-md text-white transition-all duration-300 ease-in-out group-hover:scale-100 whitespace-nowrap">
          Envoyer le message
        </span>
      )}
    </div>
  );
}
