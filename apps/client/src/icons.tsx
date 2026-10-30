import { useId } from "react";

// Original vector inventory/skill icons. No platform emoji or proprietary assets.
export function Icon({
  name,
  color = "#aa9bdf",
}: {
  name: string;
  color?: string;
}) {
  const id = "art" + useId().replaceAll(":", "");
  const silver = `url(#${id}s)`,
    gold = `url(#${id}g)`;
  const sword = (
    <>
      <path d="M21 42 42 11 52 6 49 19 28 47Z" fill={silver} />
      <path d="m26 42 22-29-5 13-13 19" stroke="#f1ecda" fill="none" />
      <path d="m16 38 18 13-3 4-18-13Z" fill={gold} />
      <path d="m21 45-9 12-5-4 10-13" fill="#755c50" />
      <path d="m7 51 7 5-3 5-7-5Z" fill={gold} />
    </>
  );
  const shield = (
    <>
      <path d="m14 10 18-5 18 5-2 25Q45 48 32 58 19 48 16 35Z" fill={gold} />
      <path d="m18 14 14-4 14 4-2 20Q41 45 32 51 23 45 20 34Z" fill={silver} />
      <path d="M32 12v37" stroke="#4d5e76" strokeWidth="3" />
      <path d="m22 24 20 0M32 18v25" stroke="#dfc490" strokeWidth="4" />
    </>
  );
  const bottle = (
    <>
      <path
        d="M25 9h14v14c3 5 12 10 12 21 0 10-8 15-19 15S13 54 13 44c0-11 9-16 12-21Z"
        fill="#9eabb7"
      />
      <path
        d="M27 25h10c3 6 10 10 10 20 0 7-6 10-15 10S17 52 17 45c0-10 7-14 10-20Z"
        fill={color}
      />
      <path
        d="M20 42c8 4 16-5 25-1v5c0 6-7 9-14 8-9 0-12-4-11-12"
        fill="#15253e"
        opacity=".22"
      />
      <path d="M24 8h16v8H24Z" fill={gold} />
      <path d="M24 4h16v6H24Z" fill="#84664c" />
      <path d="M23 34q-5 5-4 12" stroke="#f7eff0" strokeWidth="2" fill="none" />
      <path d="M29 17v6" stroke="#e9e5db" strokeWidth="2" />
    </>
  );
  let art;
  if (["swordShield", "greatsword", "strike", "dual", "dagger"].includes(name))
    art = (
      <>
        {name === "dual" && (
          <g transform="translate(64 0) scale(-1 1)">{sword}</g>
        )}
        {sword}
        {name === "swordShield" && (
          <g transform="translate(1 26) scale(.5)">{shield}</g>
        )}
      </>
    );
  else if (["shield", "guard", "counter"].includes(name)) art = shield;
  else if (["hp", "mp", "potion"].includes(name)) art = bottle;
  else if (name === "bow")
    art = (
      <>
        <path d="M17 7q46 24 0 50l5-12q23-13 0-26Z" fill={gold} />
        <path d="M18 8v48" stroke="#e6e7d6" />
        <path d="M7 32h45m-8-5 10 5-10 5" stroke="#e5e2cd" strokeWidth="2" />
        <path d="m8 27 8 5-8 5" stroke="#bc6f6b" strokeWidth="3" />
      </>
    );
  else if (["staff", "magicMace", "magic", "restore"].includes(name))
    art = (
      <>
        <path d="m15 57 22-33 5 3-21 34Z" fill={gold} />
        <path
          d="M36 26q-14-6-3-18 14-9 22 4 5 13-13 19"
          stroke="#c6ac75"
          strokeWidth="4"
          fill="none"
        />
        <path d="m43 8 8 8-8 12-8-10Z" fill={color} />
        <path d="m42 11-4 8 4 4" stroke="#e5eaff" strokeWidth="2" fill="none" />
      </>
    );
  else if (["polearm", "hammer", "forge"].includes(name))
    art = (
      <>
        <path d="m10 56 31-40 5 4-31 40Z" fill="#a88e68" />
        {name === "polearm" ? (
          <path d="m38 23-2-14L57 3l-5 22-13 2 8-13Z" fill={silver} />
        ) : (
          <>
            <path d="m27 10 12-7 22 22-9 13-9-1Z" fill={silver} />
            <path
              d="m30 12 22 22M37 6l22 22"
              stroke="#e1d9c6"
              strokeWidth="3"
            />
          </>
        )}
      </>
    );
  else if (name === "fist" || name === "gloves")
    art = (
      <>
        <path
          d="m18 50-7-23 8-5 5 10-2-19 7-2 4 17-1-20 7 1 2 20 4-14 7 3-3 23-9 14Z"
          fill={gold}
        />
        <path d="m16 49 6 11 22-5-3-12Z" fill={silver} />
        <path d="m20 34 19-4" stroke="#e5d5b4" strokeWidth="2" />
      </>
    );
  else if (["heal", "partyDefense"].includes(name))
    art = (
      <>
        <circle cx="32" cy="32" r="24" fill="#3f6e65" stroke="#b5c6a3" />
        <path d="M27 14h10v13h13v10H37v13H27V37H14V27h13Z" fill="#e7dfb3" />
        <path d="m9 8 4 6 7 1-6 4-1 7-4-6-7-1 6-4Z" fill="#bbebcf" />
      </>
    );
  else if (name === "aoe" || name === "debuff" || name === "partyAttack")
    art = (
      <>
        <ellipse
          cx="32"
          cy="41"
          rx="26"
          ry="16"
          fill="#373550"
          stroke={color}
        />
        <ellipse cx="32" cy="41" rx="19" ry="10" fill="none" stroke="#d3c4f3" />
        <path
          d="m32 4 6 20 13-7-7 16 14 6-20 4-6 16-6-16-20-4 14-6-7-16 13 7Z"
          fill={color}
        />
        <path d="m32 16 3 16 11 7-12-1-2 11-3-11-12 1 12-7Z" fill="#ede2c8" />
      </>
    );
  else if (name === "vampire" || name === "leech")
    art = (
      <>
        <path
          d="M32 5C26 19 12 30 12 42a20 20 0 0 0 40 0C52 30 38 19 32 5"
          fill="#b86881"
          stroke="#d9a19d"
        />
        <path d="m20 33 8 7-4 11 12-15-6 3 5-15" fill="#eac8bc" />
      </>
    );
  else if (name === "helmet" || name === "character" || name === "class")
    art = (
      <>
        <path d="M13 34C10 5 50 1 51 33l-4 22-15-7-14 7Z" fill={silver} />
        <path d="m17 27 14 4 16-4-3 11-11 3-12-4Z" fill="#212c43" />
        <path d="M31 13h4v35h-4Z" fill={gold} />
        <path d="m18 13 12-5 14 5" stroke="#e4ded0" fill="none" />
      </>
    );
  else if (name === "chest")
    art = (
      <>
        <path
          d="m22 8-14 9-4 13 12 7 6-6-3 23 13 5 14-5-4-23 6 6 12-7-4-13-14-9-10 8Z"
          fill={silver}
        />
        <path
          d="m14 17 18 12 18-12M32 29v21M22 50h20"
          stroke="#d8bd85"
          strokeWidth="3"
        />
      </>
    );
  else if (name === "legs" || name === "boots")
    art = (
      <>
        <path
          d="m15 7 35 1-5 44 9 3-2 6H35l-3-34-6 33H9l-1-6 7-5Z"
          fill={silver}
        />
        <path
          d="m15 9 33 1M15 16h31M13 47l12 3M35 49l11-2"
          stroke="#c6ac76"
          strokeWidth="3"
        />
      </>
    );
  else if (name === "ring" || name === "necklace")
    art = (
      <>
        <ellipse
          cx="32"
          cy="38"
          rx="19"
          ry="21"
          fill="none"
          stroke="#d0b271"
          strokeWidth="7"
        />
        <path
          d="m32 3 13 14-13 16-13-16Z"
          fill={color}
          stroke="#e0c995"
          strokeWidth="3"
        />
        <path d="m31 7-7 10 8 9" stroke="#ebe3fa" fill="none" />
      </>
    );
  else if (name === "summon")
    art = (
      <>
        <path d="m16 24 16-8 16 8 5 25-21 10-21-10Z" fill={silver} />
        <path d="m23 6 9-4 10 4-2 16-16 1Z" fill={gold} />
        <path d="m6 27 13-3 2 24-13 2Zm38-3 13 3-2 23-13-2Z" fill={gold} />
        <circle cx="32" cy="36" r="7" fill="#8fd6dc" stroke="#e2d7b6" />
        <path d="M26 11h12" stroke="#73d7d7" strokeWidth="3" />
      </>
    );
  else if (name === "spoil" || name === "sweep" || name === "material")
    art = (
      <>
        <path d="m19 36-8-9 8-16 13-8 16 8 6 17-13 12-8 19Z" fill="#a6ada4" />
        <path d="m18 16 12-4 8 14-12 7Z" fill="#ded9c4" />
        <path d="m35 29 11-12 2 12-12 14Z" fill="#697d8d" />
        <path d="m13 41 13 6-8 12-12-6Z" fill={gold} />
      </>
    );
  else if (name === "evade" || name === "retreat")
    art = (
      <>
        <path
          d="m28 7 20 5-8 24 14 13-3 10-25-2-4-16-10 5-6-9 17-14Z"
          fill={silver}
        />
        <path d="m7 15 16-1M5 24h12M9 33h8" stroke={color} strokeWidth="3" />
        <path d="m26 49 24 3" stroke="#d7c395" strokeWidth="3" />
      </>
    );
  else if (name === "party")
    art = (
      <>
        <circle cx="33" cy="17" r="10" fill={gold} />
        <circle cx="12" cy="29" r="7" fill={silver} />
        <circle cx="53" cy="29" r="7" fill={silver} />
        <path
          d="M17 59V44c0-19 32-19 32 0v15ZM2 56V43c0-10 12-11 15-5v18Zm47 0V38c8-6 14 0 14 8v10Z"
          fill={silver}
        />
      </>
    );
  else if (name === "hunts")
    art = (
      <>
        <path d="M12 58V25a20 20 0 0 1 40 0v33Z" fill={silver} />
        <path d="M20 58V26a12 12 0 0 1 24 0v32Z" fill="#60577f" />
        <ellipse cx="32" cy="37" rx="8" ry="17" fill="#8eaacb" />
        <path d="m26 30 5 6-4 9 10-11-5 2 5-11" fill="#e2e3f2" />
      </>
    );
  else
    art = (
      <>
        <path
          d="M15 20c-5-17 39-17 34 0l7 33c-4 11-44 11-48 0Z"
          fill="#82745b"
        />
        <path
          d="M17 19h31M24 7l2 13M38 7l-1 13"
          stroke="#dcc495"
          strokeWidth="3"
        />
        <path d="M22 34h20v17H22Z" fill={gold} />
        <path d="M31 36h3v12h-3Z" fill="#5c5149" />
      </>
    );
  return (
    <svg
      className="game-icon"
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#e1e0cf" />
          <stop offset=".4" stopColor="#93a4b6" />
          <stop offset="1" stopColor="#465576" />
        </linearGradient>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#ecd7a1" />
          <stop offset=".5" stopColor="#b89c6a" />
          <stop offset="1" stopColor="#705442" />
        </linearGradient>
      </defs>
      <g
        stroke="#1b2035"
        strokeWidth="1.4"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        {art}
      </g>
    </svg>
  );
}
