const shimmer = {
  background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmerSkeleton 1.5s infinite',
  borderRadius: '12px',
};

export function SkeletonCard() {
  return (
    <div style={{
      padding: '20px',
      marginBottom: '12px',
      background: 'rgba(19, 24, 38, 0.5)',
      backdropFilter: 'blur(24px)',
      border: '1px solid rgba(255, 255, 255, 0.06)',
      borderRadius: '20px',
    }}>
      <div style={{ ...shimmer, width: '120px', height: '14px', marginBottom: '12px' }} />
      <div style={{ ...shimmer, width: '80px', height: '32px', marginBottom: '12px' }} />
      <div style={{ display: 'flex', gap: '8px' }}>
        <div style={{ ...shimmer, width: '80px', height: '28px', borderRadius: '20px' }} />
        <div style={{ ...shimmer, width: '60px', height: '28px', borderRadius: '20px' }} />
        <div style={{ ...shimmer, width: '70px', height: '28px', borderRadius: '20px' }} />
      </div>
    </div>
  );
}

export function SkeletonButton() {
  return <div style={{ ...shimmer, width: '100%', height: '52px', borderRadius: '16px', marginBottom: '10px' }} />;
}

export function SkeletonHeader() {
  return (
    <div style={{
      padding: '32px 20px',
      marginBottom: '12px',
      background: 'rgba(19, 24, 38, 0.5)',
      backdropFilter: 'blur(24px)',
      border: '1px solid rgba(255, 255, 255, 0.06)',
      borderRadius: '20px',
      textAlign: 'center',
    }}>
      <div style={{ ...shimmer, width: '72px', height: '72px', borderRadius: '22px', margin: '0 auto 12px' }} />
      <div style={{ ...shimmer, width: '140px', height: '20px', margin: '0 auto 8px' }} />
      <div style={{ ...shimmer, width: '100px', height: '12px', margin: '0 auto' }} />
    </div>
  );
}

export function HomeSkeleton() {
  return (
    <div style={{ padding: '20px 16px 100px', minHeight: '100vh' }}>
      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        <SkeletonHeader />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonButton />
        <SkeletonButton />
      </div>
    </div>
  );
}
