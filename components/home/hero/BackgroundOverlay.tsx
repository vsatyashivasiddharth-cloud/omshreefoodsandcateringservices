export default function BackgroundOverlay() {
  return (
    <>
      <div
        aria-hidden="true"
        className="absolute inset-0 z-10 bg-black/55"
      />

      <div
        aria-hidden="true"
        className="absolute inset-0 z-10 bg-gradient-to-r from-black/70 via-black/35 to-black/20"
      />

      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 z-10 h-40 bg-gradient-to-t from-black/45 to-transparent"
      />
    </>
  );
}