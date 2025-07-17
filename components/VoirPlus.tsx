import React, { useState } from "react";
import { Plus } from "lucide-react"; // Assure-toi que l'icône est bien importée

const VoirPlus = () => {
  const [clicked, setClicked] = useState(false);

  const handleClick = () => {
    setClicked(true);
    // Tu peux aussi ajouter une logique ici, par exemple : console.log("Voir plus cliqué")
  };

  return (
    <span
      className="flex items-center gap-1 cursor-pointer"
      onClick={handleClick}
      style={{
        fontFamily: 'typo',
        color: clicked ? "#cfc6bf" : "#e88b00" }} // #1f2937 = Tailwind 'text-gray-800'
    >
       ...Voir plus
    </span>
  );
};

export default VoirPlus;
