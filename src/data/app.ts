// Android app listing. Placement tags the install source so Play Console
// shows which spot on the site drives installs.
export const PLAY_PACKAGE = 'com.zappnia.yesnobutton';

export type AppPlacement = 'header' | 'home' | 'blog' | 'footer';

export function playUrl(placement: AppPlacement): string {
  const referrer = encodeURIComponent(
    `utm_source=yesnobuttonapp.com&utm_medium=website&utm_campaign=${placement}`,
  );
  return `https://play.google.com/store/apps/details?id=${PLAY_PACKAGE}&referrer=${referrer}`;
}
