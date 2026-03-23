"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowRight, FileUp, FolderPlus } from "lucide-react";

import { AppShell } from "@/src/components/layout/app-shell";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Panel, PanelHeader } from "@/src/components/ui/panel";
import { Textarea } from "@/src/components/ui/textarea";
import { browserApi } from "@/src/lib/api/client";

export function ProjectNewClient() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCreateProject() {
    startTransition(async () => {
      try {
        const created = await browserApi.createProject({
          name,
          description,
          metadata: {
            source: "project_new",
          },
        });
        setError(null);
        router.push(`/project/ingest?projectId=${created.id}`);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Failed to create project.",
        );
      }
    });
  }

  return (
    <AppShell
      description="Mulai case baru dengan nama dan detail singkat, lalu lanjutkan langsung ke ingest untuk memasukkan source material."
      eyebrow="New case"
      title="Create project"
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_0.92fr]">
        <Panel className="rounded-[30px] p-5 md:p-6">
          <PanelHeader
            description="Flow baru dibuat ringkas: isi nama project, detail singkat, lalu lanjut ke ingest."
            eyebrow="Step 1"
            title="Project basics"
          />

          <div className="mt-6 grid gap-4">
            <label className="grid gap-2">
              <span className="font-mono text-[11px] uppercase tracking-[0.26em] text-emerald-50/44">
                Project name
              </span>
              <Input
                onChange={(event) => setName(event.target.value)}
                placeholder="Contoh: Digital stock monitoring"
                value={name}
              />
            </label>

            <label className="grid gap-2">
              <span className="font-mono text-[11px] uppercase tracking-[0.26em] text-emerald-50/44">
                Detail
              </span>
              <Textarea
                className="min-h-36"
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Tuliskan konteks singkat masalah, tujuan, atau ruang lingkup analisis."
                value={description}
              />
            </label>

            {error ? (
              <div className="rounded-[22px] border border-emerald-200/12 bg-emerald-300/8 px-4 py-3 text-sm text-white/78">
                {error}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <Button
                disabled={isPending || name.trim().length < 3}
                onClick={handleCreateProject}
              >
                <FolderPlus className="size-4" />
                Continue to ingest
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        </Panel>

        <Panel className="rounded-[30px] p-5 md:p-6">
          <PanelHeader
            description="Dashboard tetap jadi tempat lihat semua project, tapi flow project baru sekarang lebih terarah."
            eyebrow="Step flow"
            title="What happens next"
          />

          <div className="mt-6 grid gap-3">
            {[
              "1. Create project dengan nama dan detail.",
              "2. Lanjut ke ingest untuk upload PDF atau paste context.",
              "3. Review hasil ekstraksi lalu buka canvas graph.",
            ].map((item) => (
              <div
                className="rounded-[24px] border border-emerald-200/10 bg-emerald-300/6 px-4 py-4 text-sm leading-6 text-white/70"
                key={item}
              >
                {item}
              </div>
            ))}

            <div className="mt-2 rounded-[24px] border border-emerald-300/18 bg-[linear-gradient(135deg,rgba(134,255,138,0.12),rgba(46,230,191,0.08))] px-4 py-4">
              <div className="inline-flex size-10 items-center justify-center rounded-2xl bg-emerald-300/14 text-emerald-100">
                <FileUp className="size-4" />
              </div>
              <p className="mt-3 text-sm font-semibold text-white">
                Ingest jadi next step default
              </p>
              <p className="mt-2 text-sm leading-6 text-white/58">
                Begitu project selesai dibuat, Qony langsung bawa kamu ke ingest supaya
                case bisa cepat punya context dan graph awal.
              </p>
            </div>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
