import React from 'react'
import { useNavigate } from 'react-router-dom';
import { BASE_URL, getImgSrc } from '../../utils/config';






const Slider = () => {
  const navigate = useNavigate();
  const [cats, setCats] = React.useState([]);

  React.useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(BASE_URL + '/api/categories');
        if (response.ok) {
          const data = await response.json();
          if (data.length > 0) {
            const formattedCats = data.map(c => ({
              img: c.image,
              title: c.name
            }));
            setCats(formattedCats);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch live categories", err);
      }
    };

    fetchCategories();
  }, []);


  return (
    <div className="bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] mb-2 md:mb-3 border-b border-gray-100 mt-2 md:mt-3 w-full md:mx-0 py-3">
      <div className="w-full max-w-[1248px] mx-auto bg-white">
        {/* Mobile: Horizontal Scroll with 2 Rows (Grid Flow Col), Desktop: Horizontal Scroll (Flex) */}
        <div className="grid grid-rows-2 grid-flow-col md:flex md:flex-row md:overflow-x-auto w-full gap-x-2 gap-y-3 px-2 md:px-0 md:gap-8 overflow-x-auto hide-scrollbar pb-2 snap-x">
          {cats.map((cat, index) => (
            <div
              key={index}
              className="snap-start flex flex-col items-center justify-start cursor-pointer group hover:text-primary transition-all duration-200 min-w-[60px] md:min-w-[64px]"
              onClick={() => navigate(`/?category=${encodeURIComponent(cat.title)}`)}
            >
              {/* Icon Container with Blue Gradient/Background */}
              <div className="mb-0.5 relative transition-transform duration-300 group-hover:-translate-y-1">
                <div className="h-[45px] w-[45px] md:h-16 md:w-16 bg-[#e0f7fa] rounded-[16px] md:rounded-[22px] flex items-center justify-center mb-1">
                  <img
                    src={getImgSrc(cat.img)}
                    alt={cat.title}
                    className="h-8 w-8 md:h-11 md:w-11 object-contain drop-shadow-sm mix-blend-multiply"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://via.placeholder.com/100?text=Error";
                    }}
                  />
                </div>
              </div>

              <div className="w-full text-center">
                <p className="text-[10px] md:text-[14px] font-bold text-gray-800 leading-tight whitespace-nowrap group-hover:text-primary font-sans transition-colors truncate w-full px-0.5">
                  {cat.title}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Slider