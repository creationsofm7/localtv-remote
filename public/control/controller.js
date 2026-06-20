/* ═══════════════════════════════════════════════════════════════
   LocalTV Phone Remote — Controller Logic
   Modular tabbed UI with pair / remote screens
   ═══════════════════════════════════════════════════════════════ */

/* Icon data inlined from @hugeicons/core-free-icons so this script
   has zero external dependencies and always runs, even when the
   /hugeicons static route is unavailable or slow on mobile. */

const ArrowDown01Icon = [["path", { d: "M18 9.00005C18 9.00005 13.5811 15 12 15C10.4188 15 6 9 6 9", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }]];
const ArrowLeft01Icon = [["path", { d: "M15 6C15 6 9.00001 10.4189 9 12C8.99999 13.5812 15 18 15 18", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }]];
const ArrowRight01Icon = [["path", { d: "M9.00005 6C9.00005 6 15 10.4189 15 12C15 13.5812 9 18 9 18", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }]];
const ArrowUp01Icon = [["path", { d: "M17.9998 15C17.9998 15 13.5809 9.00001 11.9998 9C10.4187 8.99999 5.99985 15 5.99985 15", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }]];
const Cancel01Icon = [["path", { d: "M18 6L6.00081 17.9992M17.9992 18L6 6.00085", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }]];
const ClosedCaptionIcon = [
  ["path", { d: "M2 12C2 8.02033 2 6.03049 3.0528 4.70201C3.22119 4.48953 3.40678 4.29302 3.60746 4.11473C4.86213 3 6.74142 3 10.5 3H13.5C17.2586 3 19.1379 3 20.3925 4.11473C20.5932 4.29302 20.7788 4.48953 20.9472 4.70201C22 6.03049 22 8.02033 22 12C22 15.9797 22 17.9695 20.9472 19.298C20.7788 19.5105 20.5932 19.707 20.3925 19.8853C19.1379 21 17.2586 21 13.5 21H10.5C6.74142 21 4.86213 21 3.60746 19.8853C3.40678 19.707 3.22119 19.5105 3.0528 19.298C2 17.9695 2 15.9797 2 12Z", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M10.5 9H10C9.06812 9 8.60218 9 8.23463 9.15224C7.74458 9.35523 7.35523 9.74458 7.15224 10.2346C7 10.6022 7 11.0681 7 12C7 12.9319 7 13.3978 7.15224 13.7654C7.35523 14.2554 7.74458 14.6448 8.23463 14.8478C8.60218 15 9.06812 15 10 15H10.5M17 9H16.5C15.5681 9 15.1022 9 14.7346 9.15224C14.2446 9.35523 13.8552 9.74458 13.6522 10.2346C13.5 10.6022 13.5 11.0681 13.5 12C13.5 12.9319 13.5 13.3978 13.6522 13.7654C13.8552 14.2554 14.2446 14.6448 14.7346 14.8478C15.1022 15 15.5681 15 16.5 15H17", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "1.5", key: "1" }],
];
const FullScreenIcon = [["path", { d: "M15.5 21C16.8956 21 17.5933 21 18.1611 20.8278C19.4395 20.44 20.44 19.4395 20.8278 18.1611C21 17.5933 21 16.8956 21 15.5M21 8.5C21 7.10444 21 6.40666 20.8278 5.83886C20.44 4.56046 19.4395 3.56004 18.1611 3.17224C17.5933 3 16.8956 3 15.5 3M8.5 21C7.10444 21 6.40666 21 5.83886 20.8278C4.56046 20.44 3.56004 19.4395 3.17224 18.1611C3 17.5933 3 16.8956 3 15.5M3 8.5C3 7.10444 3 6.40666 3.17224 5.83886C3.56004 4.56046 4.56046 3.56004 5.83886 3.17224C6.40666 3 7.10444 3 8.5 3", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }]];
const Home01Icon = [
  ["path", { d: "M3 11.9896V14.5C3 17.7998 3 19.4497 4.02513 20.4749C5.05025 21.5 6.70017 21.5 10 21.5H14C17.2998 21.5 18.9497 21.5 19.9749 20.4749C21 19.4497 21 17.7998 21 14.5V11.9896C21 10.3083 21 9.46773 20.6441 8.74005C20.2882 8.01237 19.6247 7.49628 18.2976 6.46411L16.2976 4.90855C14.2331 3.30285 13.2009 2.5 12 2.5C10.7991 2.5 9.76689 3.30285 7.70242 4.90855L5.70241 6.46411C4.37533 7.49628 3.71179 8.01237 3.3559 8.74005C3 9.46773 3 10.3083 3 11.9896Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M15.0002 17C14.2007 17.6224 13.1504 18 12.0002 18C10.8499 18 9.79971 17.6224 9.00018 17", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }],
];
const KeyboardIcon = [
  ["path", { d: "M14.5 7H9.5C6.21252 7 4.56878 7 3.46243 7.90796C3.25989 8.07418 3.07418 8.25989 2.90796 8.46243C2 9.56878 2 11.2125 2 14.5C2 17.7875 2 19.4312 2.90796 20.5376C3.07418 20.7401 3.25989 20.9258 3.46243 21.092C4.56878 22 6.21252 22 9.5 22H14.5C17.7875 22 19.4312 22 20.5376 21.092C20.7401 20.9258 20.9258 20.7401 21.092 20.5376C22 19.4312 22 17.7875 22 14.5C22 11.2125 22 9.56878 21.092 8.46243C20.9258 8.25989 20.7401 8.07418 20.5376 7.90796C19.4312 7 17.7875 7 14.5 7Z", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M12 7V5C12 4.44772 12.4477 4 13 4C13.5523 4 14 3.55228 14 3V2", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }],
  ["path", { d: "M7 12L8 12", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "2" }],
  ["path", { d: "M11.5 12L12.5 12", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "3" }],
  ["path", { d: "M16 12L17 12", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "4" }],
  ["path", { d: "M7 17L17 17", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "5" }],
];
const PauseIcon = [
  ["path", { d: "M4 7C4 5.58579 4 4.87868 4.43934 4.43934C4.87868 4 5.58579 4 7 4C8.41421 4 9.12132 4 9.56066 4.43934C10 4.87868 10 5.58579 10 7V17C10 18.4142 10 19.1213 9.56066 19.5607C9.12132 20 8.41421 20 7 20C5.58579 20 4.87868 20 4.43934 19.5607C4 19.1213 4 18.4142 4 17V7Z", stroke: "currentColor", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M14 7C14 5.58579 14 4.87868 14.4393 4.43934C14.8787 4 15.5858 4 17 4C18.4142 4 19.1213 4 19.5607 4.43934C20 4.87868 20 5.58579 20 7V17C20 18.4142 20 19.1213 19.5607 19.5607C19.1213 20 18.4142 20 17 20C15.5858 20 14.8787 20 14.4393 19.5607C14 19.1213 14 18.4142 14 17V7Z", stroke: "currentColor", strokeWidth: "1.5", key: "1" }],
];
const PlayCircleIcon = [
  ["circle", { cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M15.9453 12.3948C15.7686 13.0215 14.9333 13.4644 13.2629 14.3502C11.648 15.2064 10.8406 15.6346 10.1899 15.4625C9.9209 15.3913 9.6758 15.2562 9.47812 15.0701C9 14.6198 9 13.7465 9 12C9 10.2535 9 9.38018 9.47812 8.92995C9.6758 8.74381 9.9209 8.60868 10.1899 8.53753C10.8406 8.36544 11.648 8.79357 13.2629 9.64983C14.9333 10.5356 15.7686 10.9785 15.9453 11.6052C16.0182 11.8639 16.0182 12.1361 15.9453 12.3948Z", stroke: "currentColor", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }],
];
const PowerIcon = [
  ["path", { d: "M18.7083 6C20.1334 7.59227 21 9.69494 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 9.69494 3.86656 7.59227 5.29168 6", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M12 3V12", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }],
];
const ReloadIcon = [["path", { d: "M15.1667 0.999756L15.7646 2.11753C16.1689 2.87322 16.371 3.25107 16.2374 3.41289C16.1037 3.57471 15.6635 3.44402 14.7831 3.18264C13.9029 2.92131 12.9684 2.78071 12 2.78071C6.75329 2.78071 2.5 6.90822 2.5 11.9998C2.5 13.6789 2.96262 15.2533 3.77093 16.6093M8.83333 22.9998L8.23536 21.882C7.83108 21.1263 7.62894 20.7484 7.7626 20.5866C7.89627 20.4248 8.33649 20.5555 9.21689 20.8169C10.0971 21.0782 11.0316 21.2188 12 21.2188C17.2467 21.2188 21.5 17.0913 21.5 11.9998C21.5 10.3206 21.0374 8.74623 20.2291 7.39023", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }]];
const ReplayIcon = [
  ["path", { d: "M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C15.0413 2 17.7655 3.35767 19.5996 5.5", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M20 2.5V6H16.5", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }],
  ["path", { d: "M15.9453 12.3577C15.7686 12.9844 14.9333 13.4273 13.2629 14.3131C11.648 15.1693 10.8406 15.5975 10.1899 15.4254C9.9209 15.3542 9.6758 15.2191 9.47812 15.0329C9 14.5827 9 13.7094 9 11.9629C9 10.2163 9 9.34307 9.47812 8.89284C9.6758 8.7067 9.9209 8.57157 10.1899 8.50042C10.8406 8.32833 11.648 8.75646 13.2629 9.61272C14.9333 10.4985 15.7686 10.9414 15.9453 11.5681C16.0182 11.8268 16.0182 12.099 15.9453 12.3577Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "2" }],
];
const Settings01Icon = [
  ["path", { d: "M21.3175 7.14139L20.8239 6.28479C20.4506 5.63696 20.264 5.31305 19.9464 5.18388C19.6288 5.05472 19.2696 5.15664 18.5513 5.36048L17.3311 5.70418C16.8725 5.80994 16.3913 5.74994 15.9726 5.53479L15.6357 5.34042C15.2766 5.11043 15.0004 4.77133 14.8475 4.37274L14.5136 3.37536C14.294 2.71534 14.1842 2.38533 13.9228 2.19657C13.6615 2.00781 13.3143 2.00781 12.6199 2.00781H11.5051C10.8108 2.00781 10.4636 2.00781 10.2022 2.19657C9.94085 2.38533 9.83106 2.71534 9.61149 3.37536L9.27753 4.37274C9.12465 4.77133 8.84845 5.11043 8.48937 5.34042L8.15249 5.53479C7.73374 5.74994 7.25259 5.80994 6.79398 5.70418L5.57375 5.36048C4.85541 5.15664 4.49625 5.05472 4.17867 5.18388C3.86109 5.31305 3.67445 5.63696 3.30115 6.28479L2.80757 7.14139C2.45766 7.74864 2.2827 8.05227 2.31666 8.37549C2.35061 8.69871 2.58483 8.95918 3.05326 9.48012L4.0843 10.6328C4.3363 10.9518 4.51521 11.5078 4.51521 12.0077C4.51521 12.5078 4.33636 13.0636 4.08433 13.3827L3.05326 14.5354C2.58483 15.0564 2.35062 15.3168 2.31666 15.6401C2.2827 15.9633 2.45766 16.2669 2.80757 16.8741L3.30114 17.7307C3.67443 18.3785 3.86109 18.7025 4.17867 18.8316C4.49625 18.9608 4.85542 18.8589 5.57377 18.655L6.79394 18.3113C7.25263 18.2055 7.73387 18.2656 8.15267 18.4808L8.4895 18.6752C8.84851 18.9052 9.12464 19.2442 9.2775 19.6428L9.61149 20.6403C9.83106 21.3003 9.94085 21.6303 10.2022 21.8191C10.4636 22.0078 10.8108 22.0078 11.5051 22.0078H12.6199C13.3143 22.0078 13.6615 22.0078 13.9228 21.8191C14.1842 21.6303 14.294 21.3003 14.5136 20.6403L14.8476 19.6428C15.0004 19.2442 15.2765 18.9052 15.6356 18.6752L15.9724 18.4808C16.3912 18.2656 16.8724 18.2055 17.3311 18.3113L18.5513 18.655C19.2696 18.8589 19.6288 18.9608 19.9464 18.8316C20.264 18.7025 20.4506 18.3785 20.8239 17.7307L21.3175 16.8741C21.6674 16.2669 21.8423 15.9633 21.8084 15.6401C21.7744 15.3168 21.5402 15.0564 21.0718 14.5354L20.0407 13.3827C19.7887 13.0636 19.6098 12.5078 19.6098 12.0077C19.6098 11.5078 19.7888 10.9518 20.0407 10.6328L21.0718 9.48012C21.5402 8.95918 21.7744 8.69871 21.8084 8.37549C21.8423 8.05227 21.6674 7.74864 21.3175 7.14139Z", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M15.5195 12C15.5195 13.933 13.9525 15.5 12.0195 15.5C10.0865 15.5 8.51953 13.933 8.51953 12C8.51953 10.067 10.0865 8.5 12.0195 8.5C13.9525 8.5 15.5195 10.067 15.5195 12Z", stroke: "currentColor", strokeWidth: "1.5", key: "1" }],
];
const Tv01Icon = [
  ["path", { d: "M2 14C2 10.2288 2 8.34315 3.17157 7.17157C4.34315 6 6.22876 6 10 6H14C17.7712 6 19.6569 6 20.8284 7.17157C22 8.34315 22 10.2288 22 14C22 17.7712 22 19.6569 20.8284 20.8284C19.6569 22 17.7712 22 14 22H10C6.22876 22 4.34315 22 3.17157 20.8284C2 19.6569 2 17.7712 2 14Z", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M9 3L12 6L16 2", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }],
];
const VolumeMinusIcon = [
  ["path", { d: "M14 14.8135V9.18646C14 6.04126 14 4.46866 13.0747 4.0773C12.1494 3.68593 11.0603 4.79793 8.88232 7.02192C7.75439 8.17365 7.11085 8.42869 5.50604 8.42869C4.10257 8.42869 3.40084 8.42869 2.89675 8.77262C1.85035 9.48655 2.00852 10.882 2.00852 12C2.00852 13.118 1.85035 14.5134 2.89675 15.2274C3.40084 15.5713 4.10257 15.5713 5.50604 15.5713C7.11085 15.5713 7.75439 15.8264 8.88232 16.9781C11.0603 19.2021 12.1494 20.3141 13.0747 19.9227C14 19.5313 14 17.9587 14 14.8135Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M17 12L22 12", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "1.5", key: "1" }],
];
const VolumeMute02Icon = [
  ["path", { d: "M14 14.8135V9.18646C14 6.04126 14 4.46866 13.0747 4.0773C12.1494 3.68593 11.0603 4.79793 8.88232 7.02192C7.75439 8.17365 7.11085 8.42869 5.50604 8.42869C4.10257 8.42869 3.40084 8.42869 2.89675 8.77262C1.85035 9.48655 2.00852 10.882 2.00852 12C2.00852 13.118 1.85035 14.5134 2.89675 15.2274C3.40084 15.5713 4.10257 15.5713 5.50604 15.5713C7.11085 15.5713 7.75439 15.8264 8.88232 16.9781C11.0603 19.2021 12.1494 20.3141 13.0747 19.9227C14 19.5313 14 17.9587 14 14.8135Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M18 10L22 14M18 14L22 10", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "1.5", key: "1" }],
];
const VolumeUpIcon = [
  ["path", { d: "M14 14.8135V9.18646C14 6.04126 14 4.46866 13.0747 4.0773C12.1494 3.68593 11.0603 4.79793 8.88232 7.02192C7.75439 8.17365 7.11085 8.42869 5.50604 8.42869C4.10257 8.42869 3.40084 8.42869 2.89675 8.77262C1.85035 9.48655 2.00852 10.882 2.00852 12C2.00852 13.118 1.85035 14.5134 2.89675 15.2274C3.40084 15.5713 4.10257 15.5713 5.50604 15.5713C7.11085 15.5713 7.75439 15.8264 8.88232 16.9781C11.0603 19.2021 12.1494 20.3141 13.0747 19.9227C14 19.5313 14 17.9587 14 14.8135Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M17 12H22M19.5 14.5L19.5 9.5", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "1.5", key: "1" }],
];

const createHugeIcon = (iconNodes) => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('aria-hidden', 'true');

  iconNodes.forEach(([tag, attrs]) => {
    const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attrs).forEach(([name, value]) => {
      node.setAttribute(name, String(value));
    });
    svg.appendChild(node);
  });

  return svg;
};

const HUGE_ICONS = {
  cancel: Cancel01Icon,
  captions: ClosedCaptionIcon,
  down: ArrowDown01Icon,
  fullscreen: FullScreenIcon,
  home: Home01Icon,
  keyboard: KeyboardIcon,
  left: ArrowLeft01Icon,
  pause: PauseIcon,
  play: PlayCircleIcon,
  power: PowerIcon,
  reload: ReloadIcon,
  replay: ReplayIcon,
  right: ArrowRight01Icon,
  settings: Settings01Icon,
  tv: Tv01Icon,
  up: ArrowUp01Icon,
  volumeDown: VolumeMinusIcon,
  volumeMute: VolumeMute02Icon,
  volumeUp: VolumeUpIcon,
};

const renderHugeIcons = () => {
  document.querySelectorAll('[data-hgi]').forEach((el) => {
    const iconName = el.getAttribute('data-hgi');
    if (!iconName || !(iconName in HUGE_ICONS)) return;
    const icon = createHugeIcon(HUGE_ICONS[iconName]);
    const rotate = Number(el.getAttribute('data-hgi-rotate') || '0');
    if (rotate) icon.style.transform = `rotate(${rotate}deg)`;
    el.textContent = '';
    el.appendChild(icon);
  });
};

renderHugeIcons();

/* ── DOM refs ── */

const pairScreen = document.getElementById('pair-screen');
const remoteScreen = document.getElementById('remote-screen');
const pairInput = document.getElementById('pair-code');
const connectBtn = document.getElementById('connect-btn');
const pairStatus = document.getElementById('pair-status');
const connDot = document.getElementById('conn-dot');
const connLabel = document.getElementById('conn-label');
const headerDot = document.getElementById('header-dot');
const trackpad = document.getElementById('trackpad');
const muteToggle = document.getElementById('mute-toggle');
const settingsBtn = document.getElementById('settings-btn');
const settingsPanel = document.getElementById('settings-panel');
const pointerSpeed = document.getElementById('pointer-speed');
const pointerSpeedValue = document.getElementById('pointer-speed-value');
const cursorVisibility = document.getElementById('cursor-visibility');
const powerActionInput = document.getElementById('power-action');
const powerBtn = document.getElementById('power-btn');
const btnBack = document.getElementById('btn-back');
const btnHome = document.getElementById('btn-home');
const btnPlayPause = document.getElementById('btn-playpause');
const volDown = document.getElementById('vol-down');
const volUp = document.getElementById('vol-up');
const volumeFill = document.getElementById('volume-fill');
const volumeValue = document.getElementById('volume-value');
const kbInput = document.getElementById('kb-input');
const kbClear = document.getElementById('kb-clear');
const dpadOk = document.getElementById('dpad-ok');
const switchTvModeBtn = document.getElementById('switch-tv-mode');
const urlInput = document.getElementById('url-input');
const navBtn = document.getElementById('nav-btn');
const panels = document.getElementById('panels');
const tabBar = document.getElementById('tab-bar');
const shortcutBtns = Array.from(document.querySelectorAll('[data-shortcut]'));
const keyBtns = Array.from(document.querySelectorAll('[data-key]'));
const tabBtns = Array.from(document.querySelectorAll('.tab[data-tab]'));
const searchParams = new URLSearchParams(window.location.search);

/* ── Constants ── */

let mouseDeltaSensitivity = 1.0;
const TAP_TIME_MS = 320;
const TAP_MOVE_PX = 14;
const TWO_FINGER_TAP_TIME_MS = 380;
const VOLUME_STEP = 3;
const SESSION_TOKEN_STORAGE_KEY = 'localtv.remote.sessionToken';
const LAST_PAIR_CODE_STORAGE_KEY = 'localtv.remote.lastPairCode';

const BINARY_TAG = {
  MOUSE_MOVE_DELTA: 0x01,
  MOUSE_MOVE: 0x02,
  MOUSE_DOWN: 0x03,
  MOUSE_UP: 0x04,
  SCROLL: 0x05,
  CLICK: 0x06,
};

const BUTTON_INDEX = { left: 0, middle: 1, right: 2 };
const REMOTE_SHORTCUT_KEY_MAP = {
  captions: 'c',
  fullscreen: 'f',
  go_back: 'BrowserBack',
  go_forward: 'BrowserForward',
  go_home: 'BrowserHome',
  play_pause: 'k',
  reload: 'BrowserRefresh',
  seek_back: 'j',
  seek_forward: 'l',
  speed_down: '<',
  speed_up: '>',
};

/* ── Binary buffers ── */

const deltaBuffer = new ArrayBuffer(9);
const deltaView = new DataView(deltaBuffer);
deltaView.setUint8(0, BINARY_TAG.MOUSE_MOVE_DELTA);

const scrollBuffer = new ArrayBuffer(5);
const scrollView = new DataView(scrollBuffer);
scrollView.setUint8(0, BINARY_TAG.SCROLL);

const clickBuffer = new ArrayBuffer(10);
const clickView = new DataView(clickBuffer);
clickView.setUint8(0, BINARY_TAG.CLICK);

/* ── State ── */

let socket = null;
let isAuthenticated = false;
let sessionToken = window.localStorage.getItem(SESSION_TOKEN_STORAGE_KEY) || '';
let hasAuthenticatedOnce = Boolean(sessionToken);
let moveFrame = 0;
let scrollFrame = 0;
let lastTouch = null;
let lastScrollY = null;
let lastPointerNorm = { x: 0.5, y: 0.5 };
let pendingDelta = null;
let pendingScroll = null;
let reconnectTimer = null;
let reconnectAttempt = 0;
let gestureMaxFingers = 0;
let singleTapCandidate = null;
let twoFingerScrollUsed = false;
let twoFingerTapStartTime = 0;
let pointerDragging = false;
let pointerLast = null;
let currentVolume = 0;
let isMuted = false;
let hasVolumeState = false;
let activeTab = 'remote';
let currentAppMode = 'remote_control';

/* ── Screen switching ── */

const showPairScreen = () => {
  pairScreen.hidden = false;
  remoteScreen.hidden = true;
};

const showRemoteScreen = () => {
  pairScreen.hidden = true;
  remoteScreen.hidden = false;
};

const setPairStatus = (label, state) => {
  connLabel.textContent = label;
  pairStatus.dataset.online = String(state === 'online');
  pairStatus.dataset.fail = String(state === 'fail');
};

/* ── Tab navigation ── */

const switchTab = (tabName) => {
  activeTab = tabName;
  tabBtns.forEach((btn) => btn.classList.toggle('tab--active', btn.dataset.tab === tabName));
  document.querySelectorAll('.panel[data-panel]').forEach((p) => {
    p.hidden = p.dataset.panel !== tabName;
  });
  panels.scrollTop = 0;
};

const syncModeSwitchButton = () => {
  // TV mode is a LocalTV Pro feature in the open-source remote. The button is
  // permanently disabled + PRO-badged in markup; do not re-enable or relabel it.
};

tabBtns.forEach((btn) => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

const setSettingsOpen = (open) => {
  if (!settingsPanel) return;
  settingsPanel.hidden = !open;
  settingsBtn?.setAttribute('data-open', String(open));
};

settingsBtn?.addEventListener('click', () => {
  if (!settingsPanel) return;
  setSettingsOpen(settingsPanel.hidden);
});

document.addEventListener('click', (event) => {
  if (!settingsPanel || settingsPanel.hidden) return;
  const target = event.target;
  if (!(target instanceof Node)) return;
  if (!settingsPanel.contains(target) && !settingsBtn?.contains(target)) {
    setSettingsOpen(false);
  }
});

pointerSpeed?.addEventListener('input', () => {
  const value = Number(pointerSpeed.value);
  if (!Number.isFinite(value) || value <= 0) return;
  mouseDeltaSensitivity = value;
  if (pointerSpeedValue) pointerSpeedValue.textContent = `${value.toFixed(1)}x`;
});

cursorVisibility?.addEventListener('change', () => {
  sendMessage({ type: 'cursor_visibility', visible: cursorVisibility.checked });
});

/* ── Helpers ── */

const sendMessage = (payload) => {
  if (!socket || socket.readyState !== WebSocket.OPEN || !isAuthenticated) return;
  socket.send(JSON.stringify(payload));
};

const sendBinary = (buffer) => {
  if (!socket || socket.readyState !== WebSocket.OPEN || !isAuthenticated) return;
  socket.send(buffer);
};

const sendText = (text) => {
  if (!text) return;
  sendMessage({ text, type: 'text' });
};

const sendRemoteAction = (action) => {
  const key = REMOTE_SHORTCUT_KEY_MAP[action];

  if (currentAppMode === 'remote_control' && key) {
    sendMessage({ key, type: 'key' });
    return;
  }

  sendMessage({ action, type: 'shortcut' });
};

const clearReconnect = () => {
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
};

const persistSessionToken = (value) => {
  sessionToken = value || '';
  if (sessionToken) {
    window.localStorage.setItem(SESSION_TOKEN_STORAGE_KEY, sessionToken);
  } else {
    window.localStorage.removeItem(SESSION_TOKEN_STORAGE_KEY);
  }
};

const scheduleReconnect = () => {
  if (!hasAuthenticatedOnce) return;
  clearReconnect();
  const delay = Math.min(1000 * 2 ** reconnectAttempt, 10000);
  reconnectAttempt += 1;
  reconnectTimer = setTimeout(() => { reconnectTimer = null; connect(true); }, delay);
};

const distancePx = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

/* ── Binary input ── */

const flushMouseDelta = () => {
  moveFrame = 0;
  if (!pendingDelta) return;
  deltaView.setFloat32(1, pendingDelta.dx, true);
  deltaView.setFloat32(5, pendingDelta.dy, true);
  sendBinary(deltaBuffer);
  pendingDelta = null;
};

const queueMouseDelta = (dx, dy) => {
  if (!pendingDelta) pendingDelta = { dx: 0, dy: 0 };
  pendingDelta.dx += dx;
  pendingDelta.dy += dy;
  if (!moveFrame) moveFrame = requestAnimationFrame(flushMouseDelta);
};

const flushScroll = () => {
  scrollFrame = 0;
  if (!pendingScroll) return;
  scrollView.setFloat32(1, pendingScroll.deltaY, true);
  sendBinary(scrollBuffer);
  pendingScroll = null;
};

const queueScroll = (deltaY) => {
  twoFingerScrollUsed = true;
  if (!pendingScroll) pendingScroll = { deltaY: 0 };
  pendingScroll.deltaY += deltaY;
  if (!scrollFrame) scrollFrame = requestAnimationFrame(flushScroll);
};

const sendClick = (button) => {
  clickView.setUint8(1, BUTTON_INDEX[button] ?? 0);
  clickView.setFloat32(2, lastPointerNorm.x, true);
  clickView.setFloat32(6, lastPointerNorm.y, true);
  sendBinary(clickBuffer);
};

const flashTrackpad = () => {
  if (!trackpad) return;
  trackpad.classList.remove('trackpad--flash');
  void trackpad.offsetWidth;
  trackpad.classList.add('trackpad--flash');
};

/* ── Volume +/- ── */

let volumeSendTimer = null;
let pendingVolumeTarget = null;

const updateVolumeUI = () => {
  if (!hasVolumeState) {
    volumeValue.textContent = '--';
    if (volumeFill) volumeFill.style.width = '0%';
    muteToggle?.classList.toggle('header__btn--muted', false);
    return;
  }

  const clamped = Math.max(0, Math.min(100, Math.round(currentVolume)));
  volumeValue.textContent = String(clamped);
  if (volumeFill) volumeFill.style.width = `${clamped}%`;
  muteToggle?.classList.toggle('header__btn--muted', isMuted);
};

const syncVolumeState = (state) => {
  if (
    !state ||
    typeof state.available !== 'boolean' ||
    typeof state.level !== 'number' ||
    typeof state.muted !== 'boolean'
  ) {
    return;
  }

  hasVolumeState = state.available;
  currentVolume = state.level;
  isMuted = state.muted;
  updateVolumeUI();
};

// Send the exact target level (not a relative delta) so the value the server
// applies equals the number shown on screen — no estimate drift between the
// phone counter and the real OS volume. volume_state still reconciles changes
// made elsewhere (e.g. the keyboard volume keys).
const flushVolumeTarget = () => {
  volumeSendTimer = null;
  if (pendingVolumeTarget === null) return;
  const percent = pendingVolumeTarget;
  pendingVolumeTarget = null;
  sendMessage({ percent, type: 'volume_set' });
};

const adjustVolume = (delta) => {
  hasVolumeState = true;
  currentVolume = Math.max(0, Math.min(100, currentVolume + delta));
  updateVolumeUI();
  pendingVolumeTarget = currentVolume;
  if (!volumeSendTimer) volumeSendTimer = setTimeout(flushVolumeTarget, 120);
};

let volRepeatInterval = null;

const startVolumeRepeat = (delta) => {
  adjustVolume(delta);
  stopVolumeRepeat();
  volRepeatInterval = setInterval(() => adjustVolume(delta), 150);
};

const stopVolumeRepeat = () => {
  if (volRepeatInterval) { clearInterval(volRepeatInterval); volRepeatInterval = null; }
  flushVolumeTarget();
};

volDown?.addEventListener('pointerdown', (e) => { e.preventDefault(); startVolumeRepeat(-VOLUME_STEP); });
volUp?.addEventListener('pointerdown', (e) => { e.preventDefault(); startVolumeRepeat(VOLUME_STEP); });
window.addEventListener('pointerup', stopVolumeRepeat);
window.addEventListener('pointercancel', stopVolumeRepeat);

updateVolumeUI();

/* ── WebSocket connection ── */

const connect = (isReconnect = false) => {
  clearReconnect();
  if (!isReconnect) reconnectAttempt = 0;
  if (socket && socket.readyState === WebSocket.OPEN) socket.close();

  socket = new WebSocket(`ws://${window.location.host}/ws`);
  socket.binaryType = 'arraybuffer';
  setPairStatus(isReconnect ? 'Reconnecting…' : 'Connecting…', 'pending');
  if (hasAuthenticatedOnce) {
    showRemoteScreen();
  }

  socket.addEventListener('open', () => {
    const payload = { type: 'auth' };
    if (sessionToken) payload.sessionToken = sessionToken;
    const pairCode = pairInput.value.trim();
    if (pairCode) payload.pairCode = pairCode;
    socket.send(JSON.stringify(payload));
  });

  socket.addEventListener('message', (event) => {
    let payload;
    try { payload = JSON.parse(event.data); } catch { return; }

    if (payload.type === 'hello') {
      if (typeof payload.appMode === 'string') {
        currentAppMode = payload.appMode;
        syncModeSwitchButton();
      }
      if (sessionToken && payload.hasTrustedSession) {
        setPairStatus('Restoring session…', 'pending');
      } else if (!payload.pairCodeRequired && !sessionToken) {
        setPairStatus('Waiting for saved remote…', 'pending');
      }
      return;
    }

    if (payload.type === 'auth_ok') {
      isAuthenticated = true;
      hasAuthenticatedOnce = true;
      reconnectAttempt = 0;
      if (typeof payload.appMode === 'string') {
        currentAppMode = payload.appMode;
      }
      if (typeof payload.sessionToken === 'string' && payload.sessionToken) {
        persistSessionToken(payload.sessionToken);
      }
      const currentCode = pairInput.value.trim();
      if (currentCode) {
        window.localStorage.setItem(LAST_PAIR_CODE_STORAGE_KEY, currentCode);
      }
      if (typeof payload.remoteCursorVisible === 'boolean' && cursorVisibility) {
        cursorVisibility.checked = payload.remoteCursorVisible;
      }
      syncModeSwitchButton();
      setPairStatus('Connected', 'online');
      showRemoteScreen();
      return;
    }

    if (payload.type === 'volume_state') {
      syncVolumeState(payload.state);
      return;
    }

    if (payload.type === 'app_mode_changed' && typeof payload.mode === 'string') {
      currentAppMode = payload.mode;
      syncModeSwitchButton();
      return;
    }

    if (payload.type === 'auth_error') {
      isAuthenticated = false;
      persistSessionToken('');
      setPairStatus('Pairing failed — check code', 'fail');
      showPairScreen();
    }
  });

  socket.addEventListener('close', () => {
    const wasAuth = isAuthenticated;
    isAuthenticated = false;

    if (wasAuth || hasAuthenticatedOnce) {
      setPairStatus('Disconnected — waiting for remote…', 'pending');
      showRemoteScreen();
    } else {
      setPairStatus('Disconnected', 'fail');
      showPairScreen();
    }

    scheduleReconnect();
  });
};

/* ── Trackpad: touch gestures ── */

if (trackpad) {
  trackpad.addEventListener('touchstart', (e) => {
    e.preventDefault();
    gestureMaxFingers = Math.max(gestureMaxFingers, e.touches.length);
    if (e.touches.length === 1) {
      const t = e.touches[0];
      lastTouch = { x: t.clientX, y: t.clientY };
      singleTapCandidate = { x: t.clientX, y: t.clientY, time: performance.now() };
    }
    if (e.touches.length === 2) {
      singleTapCandidate = null;
      const [a, b] = e.touches;
      lastScrollY = (a.clientY + b.clientY) / 2;
      twoFingerTapStartTime = performance.now();
    }
  });

  trackpad.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (e.touches.length === 1 && lastTouch && singleTapCandidate) {
      const t = e.touches[0];
      if (distancePx(singleTapCandidate, { x: t.clientX, y: t.clientY }) > TAP_MOVE_PX) {
        singleTapCandidate = null;
      }
    }
    if (e.touches.length === 1 && lastTouch) {
      const bounds = trackpad.getBoundingClientRect();
      const dx = (e.touches[0].clientX - lastTouch.x) / bounds.width;
      const dy = (e.touches[0].clientY - lastTouch.y) / bounds.height;
      lastTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      lastPointerNorm.x = Math.min(1, Math.max(0, lastPointerNorm.x + dx * mouseDeltaSensitivity));
      lastPointerNorm.y = Math.min(1, Math.max(0, lastPointerNorm.y + dy * mouseDeltaSensitivity));
      queueMouseDelta(dx, dy);
      return;
    }
    if (e.touches.length === 2) {
      const [a, b] = e.touches;
      const currentY = (a.clientY + b.clientY) / 2;
      if (lastScrollY !== null) queueScroll((lastScrollY - currentY) * 1.5);
      lastScrollY = currentY;
    }
  });

  trackpad.addEventListener('touchend', (e) => {
    const remaining = e.touches.length;
    if (remaining === 0) {
      const now = performance.now();
      if (gestureMaxFingers === 1 && singleTapCandidate && now - singleTapCandidate.time <= TAP_TIME_MS) {
        sendClick('left');
        flashTrackpad();
      } else if (gestureMaxFingers === 2 && !twoFingerScrollUsed && now - twoFingerTapStartTime <= TWO_FINGER_TAP_TIME_MS) {
        sendClick('right');
        flashTrackpad();
      }
      gestureMaxFingers = 0;
      singleTapCandidate = null;
      twoFingerScrollUsed = false;
      lastTouch = null;
      lastScrollY = null;
      return;
    }
    if (remaining === 1) {
      lastScrollY = null;
      lastTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      gestureMaxFingers = Math.max(gestureMaxFingers, 1);
    }
  });

  /* Trackpad: mouse pointer (desktop testing) */
  trackpad.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    e.preventDefault();
    trackpad.setPointerCapture(e.pointerId);
    pointerDragging = true;
    pointerLast = { x: e.clientX, y: e.clientY };
    singleTapCandidate = { x: e.clientX, y: e.clientY, time: performance.now() };
  });

  trackpad.addEventListener('pointermove', (e) => {
    if (!pointerDragging || e.pointerType !== 'mouse' || !pointerLast) return;
    const bounds = trackpad.getBoundingClientRect();
    const dx = (e.clientX - pointerLast.x) / bounds.width;
    const dy = (e.clientY - pointerLast.y) / bounds.height;
    pointerLast = { x: e.clientX, y: e.clientY };
    if (singleTapCandidate && distancePx(singleTapCandidate, pointerLast) > TAP_MOVE_PX) singleTapCandidate = null;
    lastPointerNorm.x = Math.min(1, Math.max(0, lastPointerNorm.x + dx * mouseDeltaSensitivity));
    lastPointerNorm.y = Math.min(1, Math.max(0, lastPointerNorm.y + dy * mouseDeltaSensitivity));
    queueMouseDelta(dx, dy);
  });

  trackpad.addEventListener('pointerup', (e) => {
    if (e.pointerType !== 'mouse') return;
    pointerDragging = false;
    pointerLast = null;
    if (e.button === 0 && singleTapCandidate && performance.now() - singleTapCandidate.time <= TAP_TIME_MS) {
      sendClick('left');
      flashTrackpad();
    }
    singleTapCandidate = null;
  });

  trackpad.addEventListener('pointercancel', () => { pointerDragging = false; pointerLast = null; singleTapCandidate = null; });

  trackpad.addEventListener('wheel', (e) => { e.preventDefault(); queueScroll(e.deltaY); }, { passive: false });
}

/* ── Control buttons ── */

btnBack?.addEventListener('click', () => sendRemoteAction('go_back'));
btnHome?.addEventListener('click', () => sendRemoteAction('go_home'));
btnPlayPause?.addEventListener('click', () => sendRemoteAction('play_pause'));

muteToggle?.addEventListener('click', () => {
  hasVolumeState = true;
  isMuted = !isMuted;
  updateVolumeUI();
  sendMessage({ type: 'volume_mute_toggle' });
});

powerBtn?.addEventListener('click', () => {
  const action = powerActionInput?.value === 'shutdown' ? 'shutdown' : 'sleep';
  const confirmed = confirm(
    action === 'shutdown'
      ? 'Shut down the computer now?'
      : 'Put the computer to sleep?',
  );
  if (!confirmed) return;
  sendMessage({ type: action === 'shutdown' ? 'system_shutdown' : 'system_sleep' });
});

/* ── Shortcut & key buttons ── */

shortcutBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    const action = btn.dataset.shortcut;
    if (action) sendRemoteAction(action);
  });
});

keyBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    sendMessage({ key: btn.dataset.key, type: 'key' });
  });
});

/* ── D-Pad OK = Enter ── */
dpadOk?.addEventListener('click', () => sendMessage({ key: 'Enter', type: 'key' }));
switchTvModeBtn?.addEventListener('click', async () => {
  try {
    switchTvModeBtn.setAttribute('disabled', 'true');
    switchTvModeBtn.textContent = 'Switching…';
    await fetch('/api/switch-mode', { method: 'POST' });
  } catch {
    switchTvModeBtn.textContent = 'Switch failed';
    setTimeout(() => {
      if (switchTvModeBtn) {
        switchTvModeBtn.textContent = 'Switch to TV Mode';
        switchTvModeBtn.removeAttribute('disabled');
      }
    }, 1500);
    return;
  }
});

/* ── Keyboard input + clear ── */

const REMOTE_INPUT_SPECIAL_KEYS = new Set([
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'Backspace',
  'Delete',
  'Enter',
  'Escape',
  'Tab',
]);

let lastKbValue = kbInput?.value ?? '';

const syncRemoteTextInput = (nextValue) => {
  const previousValue = lastKbValue;

  if (nextValue === previousValue) return;

  let prefixLength = 0;
  const maxPrefix = Math.min(previousValue.length, nextValue.length);
  while (
    prefixLength < maxPrefix &&
    previousValue[prefixLength] === nextValue[prefixLength]
  ) {
    prefixLength += 1;
  }

  let previousSuffixLength = previousValue.length;
  let nextSuffixLength = nextValue.length;
  while (
    previousSuffixLength > prefixLength &&
    nextSuffixLength > prefixLength &&
    previousValue[previousSuffixLength - 1] === nextValue[nextSuffixLength - 1]
  ) {
    previousSuffixLength -= 1;
    nextSuffixLength -= 1;
  }

  const removedCount = previousSuffixLength - prefixLength;
  const insertedText = nextValue.slice(prefixLength, nextSuffixLength);

  for (let i = 0; i < removedCount; i += 1) {
    sendMessage({ key: 'Backspace', type: 'key' });
  }

  sendText(insertedText);
  lastKbValue = nextValue;
};

kbInput?.addEventListener('keydown', (e) => {
  if (!REMOTE_INPUT_SPECIAL_KEYS.has(e.key)) return;
  sendMessage({ key: e.key, type: 'key' });
});

kbInput?.addEventListener('input', () => {
  syncRemoteTextInput(kbInput.value);
});

kbClear?.addEventListener('click', () => {
  if (!kbInput) return;
  if (kbInput.value) {
    syncRemoteTextInput('');
  }
  kbInput.value = '';
  kbInput.focus();
});

/* ── URL navigation ── */

navBtn?.addEventListener('click', () => {
  const url = urlInput?.value?.trim();
  if (url) sendMessage({ type: 'navigate', url });
});

urlInput?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const url = urlInput.value.trim();
    if (url) sendMessage({ type: 'navigate', url });
  }
});

/* ── Connect button ── */

const pairForm = document.getElementById('pair-form');
pairForm?.addEventListener('submit', (e) => { e.preventDefault(); clearReconnect(); connect(false); });

connectBtn?.addEventListener('click', () => { clearReconnect(); connect(false); });

pairInput?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); clearReconnect(); connect(false); }
});

/* ── Auto-connect from URL param or LocalStorage ── */

const initialPairCode = searchParams.get('pairCode');
const savedPairCode = window.localStorage.getItem(LAST_PAIR_CODE_STORAGE_KEY);

if (initialPairCode) {
  pairInput.value = initialPairCode;
  connect(false);
} else if (sessionToken) {
  if (savedPairCode) pairInput.value = savedPairCode; // Fallback if session expires
  setPairStatus('Restoring session…', 'pending');
  showRemoteScreen();
  connect(false);
} else if (savedPairCode) {
  pairInput.value = savedPairCode;
  connect(false);
}

syncModeSwitchButton();
