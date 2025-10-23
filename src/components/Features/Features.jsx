import React from 'react'
import { RiGamepadLine } from "react-icons/ri";
import { RiBookOpenLine } from "react-icons/ri";
import { RiPuzzle2Line } from "react-icons/ri";
import { motion } from "framer-motion";


// Updated FeaturesData with descriptions
const FeaturesData = [
  {
    id: 1,
    title: "Thematic Learning Mode",
    link: "#",
    icon: <RiPuzzle2Line />,
    delay: 0.2,
    description:
      "Practice spelling through themed quizzes, with customizable word lists for teachers.",
  },
  {
    id: 2,
    title: "Story Mode",
    link: "#",
    icon: <RiBookOpenLine />,
    delay: 0.3,
    description:
      "Read engaging stories and test comprehension with optional quizzes.",
  },
  {
    id: 3,
    title: "Level-Based Learning Mode",
    link: "#",
    icon: <RiGamepadLine />,
    delay: 0.4,
    description:
      "Advance through game-like levels with spelling quizzes that grow in difficulty and earn EXP points to unlock more levels.",
  },
];

const SlideLeft = (delay) => {
  return {
    initial: {
      opacity: 0,
      x: 50,
    },
    animate: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3,
        delay: delay,
        ease: "easeInOut",
      },
    },
  };
};

const Features = () => {
  return (
    <section className="bg-white" id="features">
          <div className="container mx-auto px-4 py-16">
            <h1 className="text-4xl font-bold text-center pb-10">
              The Unique Features We Provide
            </h1>
            {/* Flexbox Container to Center the Grid */}
            <div className="flex flex-col md:flex-row justify-center gap-8">
              {/* Grid Layout for Cards */}
              <div
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 
                w-full md:w-auto"
              >
                {FeaturesData.slice(0, 3).map((feature) => (
                  <motion.div
                    key={feature.id}
                    variants={SlideLeft(feature.delay)}
                    initial="initial"
                    whileInView="animate"
                    viewport={{ once: true }}
                    className="bg-[#f4f4f4] rounded-2xl flex flex-col gap-4 items-center justify-center p-8 hover:bg-white hover:scale-110 duration-300 hover:shadow-2xl"
                  >
                    <div className="text-4xl mb-4">{feature.icon}</div>
                    <h1 className="text-lg font-semibold text-center px-3">
                      {feature.title}
                    </h1>
                    {/* Add Description */}
                    <p className="text-sm text-center mt-2 service-description">
                      {feature.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>
  )
}

export default Features