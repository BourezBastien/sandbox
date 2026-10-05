import Image from "next/image"

import { NewGameComposer } from "@/components/new-game-composer"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export default async function Page() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6">
      <Empty className="flex-none">
        <EmptyHeader>
          <EmptyMedia>
            <Image src="/logo.svg" alt="Logo" width={48} height={48} />
          </EmptyMedia>
          <EmptyTitle className="text-2xl">
            Qu&apos;est-ce qu&apos;on construit aujourd&apos;hui&nbsp;?
          </EmptyTitle>
          <EmptyDescription>
            Crée tes propres courses, jeux de tir, casse-têtes et des mondes
            entiers avec tes propres mots. Si tu peux le décrire, tu peux y
            jouer.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="max-w-2xl gap-6">
          <NewGameComposer />
        </EmptyContent>
      </Empty>
    </div>
  )
}
