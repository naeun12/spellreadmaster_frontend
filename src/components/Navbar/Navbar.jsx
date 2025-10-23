import React from 'react';
import { IoMdMenu } from 'react-icons/io';
import { motion } from 'framer-motion';
import LogoPng from '../../assets/logo.png';
import { Link } from 'react-router-dom'; // Import Link from react-router

const NavbarMenu = [
  {
    id: 1,
    title: 'Home',
    path: '/',
  },
  {
    id: 2,
    title: 'Features',
    path: '#features',
  },
  {
    id: 3,
    title: 'About Us',
    path: '#banner',
  },
];

// Helper function for smooth scrolling
const handleScroll = (e, path) => {
  e.preventDefault();
  const element = document.querySelector(path);
  if (element) {
    window.scrollTo({
      top: element.offsetTop - 80, // Add offset for padding or fixed nav
      behavior: 'smooth',
    });
  }
};

const Navbar = () => {
  return (
    <nav className="relative z-20">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="container py-10 flex justify-between items-center"
      >
        {/* Logo Section */}
        <div>
          <img
            src={LogoPng}
            alt="Logo"
            className="w-[120px] h-[60px] object-contain transition-transform hover:scale-105 duration-300"
          />
        </div>

        {/* Menu Section */}
        <div className="hidden lg:block">
          <ul className="flex items-center gap-3">
            {NavbarMenu.map((menu) =>
              menu.path.startsWith('#') ? (
                <li key={menu.id}>
                  <a
                    href={menu.path}
                    onClick={(e) => handleScroll(e, menu.path)}
                    className="inline-block py-2 px-3 hover:text-[#fcb436] relative group cursor-pointer"
                  >
                    <div className="w-2 h-2 bg-[#fcb436] absolute mt-4 rounded-full left-1/2 -translate-x-1/2 top-1/2 bottom-0 group-hover:block hidden"></div>
                    {menu.title}
                  </a>
                </li>
              ) : (
                <li key={menu.id}>
                  <Link
                    to={menu.path}
                    className="inline-block py-2 px-3 hover:text-[#fcb436] relative group"
                  >
                    <div className="w-2 h-2 bg-[#fcb436] absolute mt-4 rounded-full left-1/2 -translate-x-1/2 top-1/2 bottom-0 group-hover:block hidden"></div>
                    {menu.title}
                  </Link>
                </li>
              )
            )}

            {/* Animated Sign-In Button with Link */}
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: '#fcb436' }}
              whileTap={{ scale: 0.98 }}
              as="div" // Make motion.button wrap around Link
              className="cursor-pointer"
            >
              <Link
                to="/login"
                className="primary-btn bg-[#fcb436] text-white px-5 py-2 rounded-md shadow-md hover:bg-[#fcb436] transition-all flex items-center gap-2"
              >
                Sign In
              </Link>
            </motion.button>
          </ul>
        </div>

        {/* Mobile Menu Button */}
        <div className="lg:hidden">
          <IoMdMenu className="text-4xl text-[#fcb436]" />
        </div>
      </motion.div>
    </nav>
  );
};

export default Navbar;