export function SkeletonCard({ style }: { style?: React.CSSProperties }) {
  return (
    <div style={{
      padding: '20px',
      marginBottom: '12px',
      background: 'rgba(19, 24, 38, 0.5)',
      backdropFilter: 'blur(24px)',
      border: '1px solid rgba(255, 255, 255, 0.06)',
      borderRadius: '20px',
      overflow: 'hidden',
      ...style,
    }}>
      <SkeletonLine width="60%" height={12} style={{ marginBottom: '12px' }} />
      <SkeletonLine width="40%" height={28} style={{ marginBottom: '12px' }} />
      <div style={{ display: 'flex', gap: '8px' }}>
        <SkeletonPill width="80px" />
        <SkeletonPill width="60px" />
        <SkeletonPill width="70px" />
      </div>
    </div>
  );
}

export function SkeletonProfile({ style }: { style?: React.CSSProperties }) {
  return (
    <div style={{
      padding: '32px 20px',
      marginBottom: '12px',
      background: 'rgba(19, 24, 38, 0.5)',
      backdropFilter: 'blur(24px)',
      border: '1px solid rgba(255, 255, 255, 0.06)',
      borderRadius: '20px',
      textAlign: 'center',
      overflow: 'hidden',
      ...style,
    }}>
      <SkeletonCircle size={72} style={{ margin: '0 auto 12px' }} />
      <SkeletonLine width="140px" height={20} style={{ margin: '0 auto 8px' }} />
      <SkeletonLine width="100px" height={12} style={{ margin: '0 auto' }} />
    </div>
  );
}

export function SkeletonButton({ style }: { style?: React.CSSProperties }) {
  return (
    <SkeletonPill width="100%" height="52px" style={{ borderRadius: '16px', ...style }} />
  );
}

export function SkeletonLine({ width, height, style }: { width: string | number; height: number; style?: React.CSSProperties }) {
  return (
    <div style={{
      width, height,
      borderRadius: '8px',
      background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmerSkeleton 1.5s infinite',
      ...style,
    }} />
  );
}

export function SkeletonCircle({ size, style }: { size: number; style?: React.CSSProperties }) {
  return (
    <div style={{
      width: size, height: size,
      borderRadius: '50%',
      background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmerSkeleton 1.5s infinite',
      ...style,
    }} />
  );
}

export function SkeletonPill({ width, height = '28px', style }: { width: string | number; height?: string; style?: React.CSSProperties }) {
  return (
    <div style={{
      width, height,
      borderRadius: '20px',
      background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmerSkeleton 1.5s infinite',
      flexShrink: 0,
      ...style,
    }} />
  );
}

export function HomeSkeleton() {
  return (
    <div style={{ padding: '20px 16px 100px', minHeight: '100vh' }}>
      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        <SkeletonProfile />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonButton />
        <SkeletonButton style={{ marginTop: '10px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
          <SkeletonPill width="100%" height="100px" style={{ borderRadius: '20px' }} />
          <SkeletonPill width="100%" height="100px" style={{ borderRadius: '20px' }} />
        </div>
      </div>
    </div>
  );
}
