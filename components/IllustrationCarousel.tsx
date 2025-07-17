import Image from "next/image";
import styles from "../app/IllustrationCarousel.module.css";

const slides = [
  { src: "/images/illustrations/1.jpg", title: "Explorez la Nature" },
  { src: "/images/illustrations/2.jpg", title: "Technologie & Innovation" },
  { src: "/images/illustrations/3.jpg", title: "Plaisirs de la Cuisine" },
  { src: "/images/illustrations/4.jpg", title: "Passion pour le Cinéma" },
  { src: "/images/illustrations/5.jpg", title: "Mobilité & Voitures" },
  { src: "/images/illustrations/6.jpg", title: "Évasion & Voyages" },
];

const IllustrationCarousel = () => {
  return (
    <div className="body-slider">
    <div className={styles.gallery}>
      {slides.map((slide, index) => (
        <Image
          key={index}
          src={slide.src}
          alt={slide.title}
          width={200} // Taille fixe pour correspondre à l'animation
          height={200}
          className={styles.image}
        />
      ))}
    </div>
    </div>
  );
};

export default IllustrationCarousel;
