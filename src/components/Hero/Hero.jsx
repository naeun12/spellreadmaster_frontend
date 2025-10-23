import React from 'react';
import Navbar from '../Navbar/Navbar';
import { IoIosArrowBack, IoIosArrowRoundForward } from 'react-icons/io';
import Blob from '../../assets/blob.svg';
import HeroPng from '../../assets/hero.png';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom'; // <-- Add this import

// FadeUp animation utility
export const FadeUp = (delay) => {
  return {
    initial: {
      opacity: 0,
      y: 50,
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
        duration: 0.5,
        delay: delay,
        ease: 'easeInOut',
      },
    },
  };
};

const Hero = () => {
  return (
    <section className="bg-light overflow-hidden relative">
      {/* Pass a link to /login to Navbar */}
      <Navbar />
      
      <div className="container grid grid-cols-1 md:grid-cols-2 min-h-[650px]">
        {/* Brand Info */}
        <div className="flex flex-col justify-center py-14 md:py-0 relative z-20">
          <div className="text-center md:text-left space-y-10 lg:max-w-[400px]">
            <motion.h1
              variants={FadeUp(0.6)}
              initial="initial"
              animate="animate"
              className="text-3xl lg:text-5xl font-bold !leading-snug"
            >
              Spell it <span className="text-[#fcb436]">Right!</span>
            </motion.h1>

            <motion.h1
              variants={FadeUp(0.6)}
              initial="initial"
              animate="animate"
              className="text-3xl lg:text-5xl font-bold !leading-snug"
            >
              Read it <span className="text-[#ea6564]">Bright!</span>
            </motion.h1>

            <motion.div
              variants={FadeUp(0.8)}
              initial="initial"
              animate="animate"
            >
              {/* Animated Get Started Button - Now uses Link */}
              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: '#fcb436' }}
                whileTap={{ scale: 0.98 }}
                as="div" // Make motion.button work as a div wrapper
                className="cursor-pointer"
              >
                <Link
                  to="/signup"
                  className="bg-[#fcb436] text-white px-6 py-3 rounded-md shadow-md hover:bg-[#fcb436] transition-all flex items-center gap-2 group"
                >
                  Get Started
                  <IoIosArrowRoundForward
                    className="text-xl group-hover:translate-x-2 group-hover:-rotate-45 duration-300"
                    aria-hidden="true"
                  />
                </Link>
              </motion.button>
            </motion.div>
          </div>
        </div>

        {/* Hero Image */}
        <div className="flex justify-center items-center">
          <motion.img
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4, ease: 'easeInOut' }}
            src={HeroPng}
            alt=""
            className="w-[400px] xl:w-[600px] relative z-10 drop-shadow"
          />
          <motion.img
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeInOut' }}
            src={Blob}
            alt=""
            className="absolute -bottom-32 w-[800px] md:w-[1500px] z-[1] hidden md:block"
          />
        </div>
      </div>
    </section>
  );
};

export default Hero;