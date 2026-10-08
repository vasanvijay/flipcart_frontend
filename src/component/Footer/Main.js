import React from 'react';
import { FaFacebookF, FaTwitter, FaYoutube, FaInstagram } from 'react-icons/fa6';
import { FaBagShopping, FaStar, FaGift, FaCircleQuestion } from 'react-icons/fa6';

const Footer = () => {
  return (
    <footer className="bg-[#172337] text-white font-sans mt-0 text-[12px] leading-relaxed">
      <div className="w-full max-w-[1200px] mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-4 border-b border-[#454d5e]">

        {/* ABOUT */}
        <div className="md:col-span-2">
          <h3 className="text-[#878787] uppercase mb-3 text-[12px]">About</h3>
          <ul className="space-y-2">
            <li><a href="#" className="hover:underline">Contact Us</a></li>
            <li><a href="#" className="hover:underline">About Us</a></li>
            <li><a href="#" className="hover:underline">Careers</a></li>
            <li><a href="#" className="hover:underline">Flipkart Stories</a></li>
            <li><a href="#" className="hover:underline">Press</a></li>
            <li><a href="#" className="hover:underline">Corporate Information</a></li>
          </ul>
        </div>

        {/* GROUP COMPANIES */}
        <div className="md:col-span-2">
          <h3 className="text-[#878787] uppercase mb-3 text-[12px]">Group Companies</h3>
          <ul className="space-y-2">
            <li><a href="#" className="hover:underline">Myntra</a></li>
            <li><a href="#" className="hover:underline">Flipkart Wholesale</a></li>
            <li><a href="#" className="hover:underline">Cleartrip</a></li>
            <li><a href="#" className="hover:underline">Shopsy</a></li>
          </ul>
        </div>

        {/* HELP */}
        <div className="md:col-span-2">
          <h3 className="text-[#878787] uppercase mb-3 text-[12px]">Help</h3>
          <ul className="space-y-2">
            <li><a href="#" className="hover:underline">Payments</a></li>
            <li><a href="#" className="hover:underline">Shipping</a></li>
            <li><a href="#" className="hover:underline">Cancellation & Returns</a></li>
            <li><a href="#" className="hover:underline">FAQ</a></li>
            <li><a href="#" className="hover:underline">Report Infringement</a></li>
          </ul>
        </div>

        {/* CONSUMER POLICY */}
        <div className="md:col-span-2">
          <h3 className="text-[#878787] uppercase mb-3 text-[12px]">Consumer Policy</h3>
          <ul className="space-y-2">
            <li><a href="#" className="hover:underline">Cancellation & Returns</a></li>
            <li><a href="#" className="hover:underline">Terms Of Use</a></li>
            <li><a href="#" className="hover:underline">Security</a></li>
            <li><a href="#" className="hover:underline">Privacy</a></li>
            <li><a href="#" className="hover:underline">Sitemap</a></li>
            <li><a href="#" className="hover:underline">Grievance Redressal</a></li>
            <li><a href="#" className="hover:underline">EPR Compliance</a></li>
          </ul>
        </div>

        {/* DIVIDER */}
        <div className="col-span-1 border-l border-[#454d5e] h-full hidden md:block"></div>

        {/* MAIL US */}
        <div className="md:col-span-3">
          <h3 className="text-[#878787] uppercase mb-3 text-[12px]">Mail Us:</h3>
          <p>
            Flipkart Internet Private Limited,<br />
            Buildings Alyssa, Begonia &<br />
            Clove Embassy Tech Village,<br />
            Outer Ring Road, Devarabeesanahalli Village,<br />
            Bengaluru, 560103,<br />
            Karnataka, India
          </p>

          <h3 className="text-[#878787] uppercase mt-6 mb-3 text-[12px]">Social:</h3>
          <div className="flex gap-4">
            <FaFacebookF className="hover:text-blue-500 cursor-pointer" />
            <FaTwitter className="hover:text-blue-400 cursor-pointer" />
            <FaYoutube className="hover:text-red-500 cursor-pointer" />
            <FaInstagram className="hover:text-pink-500 cursor-pointer" />
          </div>
        </div>

      </div>

      {/* BOTTOM STRIP */}
      <div className="py-6 container mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-[12px] gap-4 md:gap-0">
        <div className="flex flex-wrap justify-center gap-4 md:gap-6 items-center">
          <div className="flex items-center gap-2"><FaBagShopping className="text-yellow-400" /> <span>Become a Seller</span></div>
          <div className="flex items-center gap-2"><FaStar className="text-yellow-400" /> <span>Advertise</span></div>
          <div className="flex items-center gap-2"><FaGift className="text-yellow-400" /> <span>Gift Cards</span></div>
          <div className="flex items-center gap-2"><FaCircleQuestion className="text-yellow-400" /> <span>Help Center</span></div>
        </div>
        <div className="text-center">
          <span>© 2007-2024 Flipkart.com</span>
        </div>
        <div>
          <img src="https://static-assets-web.flixcart.com/fk-p-linchpin-web/fk-cp-zion/img/payment-method_69e7ec.svg" alt="Payments" className="h-4" />
        </div>
      </div>
    </footer>
  );
}

export default Footer;