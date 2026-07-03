export function ContainerMain({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col pb-10">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="space-y-4 px-4 lg:px-6">{children}</div>
      </div>
    </div>
  )
}
