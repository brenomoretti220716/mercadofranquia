'use client'

export default function Guide() {
  return (
    <>
      <div className="flex-col bg-white relative w-full h-auto overflow-hidden p-10 mt-5 rounded-lg">
        <div className="mb-5 text-xl font-bold">
          <h2>Mais recentes</h2>
        </div>

        <div className="flex flex-col">
          <a
            href=""
            className="flex justify-between border-b border-[#d3d3d3] py-5"
          >
            <h3>Como escolher a franquia ideal</h3>
            <h3>{'>'}</h3>
          </a>
          <a
            href=""
            className="flex justify-between border-b border-[#d3d3d3] py-5"
          >
            <h3>Entendendo a Circular de Oferta de Franquia</h3>
            <h3>{'>'}</h3>
          </a>
          <a
            href=""
            className="flex justify-between border-b border-[#d3d3d3] py-5"
          >
            <h3>Direitos e deveres do franqueado</h3>
            <h3>{'>'}</h3>
          </a>
        </div>
      </div>
    </>
  )
}
