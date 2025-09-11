export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-blue-50">
      <div className="flex min-h-screen w-full justify-center items-center p-4">
        {children}
      </div>
    </div>
  );
}