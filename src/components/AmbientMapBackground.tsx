export function AmbientMapBackground() {
  return (
    <div className="landing-map-ambient" aria-hidden="true">
      <svg className="landing-map-svg" viewBox="0 0 960 540" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="ambientMapFill" x1="148" y1="146" x2="790" y2="402" gradientUnits="userSpaceOnUse">
            <stop stopColor="rgba(92,184,253,0.24)" />
            <stop offset="1" stopColor="rgba(130,247,216,0.08)" />
          </linearGradient>
          <linearGradient id="ambientMapStroke" x1="196" y1="118" x2="736" y2="412" gradientUnits="userSpaceOnUse">
            <stop stopColor="rgba(222,244,255,0.8)" />
            <stop offset="1" stopColor="rgba(130,247,216,0.28)" />
          </linearGradient>
        </defs>

        <path
          className="landing-map-fill"
          d="M118 248L150 231L196 240L238 224L284 227L327 205L387 214L438 194L493 207L542 200L602 213L661 233L718 236L782 258L809 287L795 317L748 325L726 350L676 347L637 372L591 366L541 379L491 370L432 387L378 379L324 392L275 386L237 366L191 362L160 332L117 316L104 284L118 248Z"
        />

        <path
          className="landing-map-outline"
          d="M118 248L150 231L196 240L238 224L284 227L327 205L387 214L438 194L493 207L542 200L602 213L661 233L718 236L782 258L809 287L795 317L748 325L726 350L676 347L637 372L591 366L541 379L491 370L432 387L378 379L324 392L275 386L237 366L191 362L160 332L117 316L104 284L118 248Z"
        />

        <g className="landing-map-grid">
          <path d="M184 242L192 360" />
          <path d="M253 228L258 385" />
          <path d="M320 210L325 390" />
          <path d="M392 211L396 383" />
          <path d="M462 198L467 378" />
          <path d="M535 203L541 381" />
          <path d="M611 217L615 366" />
          <path d="M686 234L688 349" />
          <path d="M138 287L794 286" />
          <path d="M175 332L746 331" />
        </g>

        <g className="landing-map-flow">
          <path d="M215 272C292 252 341 248 404 256C479 265 544 285 620 295C671 301 713 300 760 288" />
          <path d="M283 340C345 321 405 316 477 321C560 327 635 344 708 338" />
        </g>

        <g className="landing-map-nodes">
          <circle cx="247" cy="251" r="5.5" />
          <circle cx="395" cy="255" r="6" />
          <circle cx="532" cy="292" r="6.5" />
          <circle cx="684" cy="303" r="5.5" />
          <circle cx="618" cy="339" r="5" />
        </g>
      </svg>
    </div>
  );
}
