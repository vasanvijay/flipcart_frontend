import React from 'react'

const DryFruits = () => {
    return (
        <div className="mx-2 grid grid-cols-2 font-bold text-sm mt-6 gap-4">
            <div className="border border-slate-200 shadow-md p-2 relative">
                <img src={A1} alt="" />
                <p className="mt-2">4 KG Mix Dry Fruits -4 Pc(s)</p>
                <p className="mt-2 text-[17px] font-bold font-sans"><span className="text-gray-400 line-through">₹790</span> <span className="text-red-500 ml-5">₹399</span></p>
                <button className="uppercase w-full text-center bg-green-800 text-white py-2 mt-2">Add To Cart</button>
                <div className="bg-red-500 absolute top-0 left-0 text-white py-2 px-2 font-sans text-[12px]">SALE!</div>
            </div>
        </div>
    )
}

export default DryFruits