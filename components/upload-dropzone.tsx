import { UploadCloud, Mic, Image, MessageSquare } from "lucide-react";

export function UploadDropzone({ clientId }: { clientId: string }) {
  return (
    <div className="card p-8">
      <input type="hidden" name="clientId" value={clientId} />

      <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[28px] border-2 border-dashed border-[#d8c7b5] bg-[#fbf3e8] px-8 text-center">
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#efe0cc] text-[#5b3f2a]">
          <UploadCloud size={36} />
        </div>

        <h2 className="text-3xl font-bold text-[#2a2118]">
          Drop client materials here
        </h2>

        <p className="mt-3 max-w-xl text-[#7b6f63]">
          Upload WhatsApp .zip files, voice notes, screenshots, or paste text.
          All files will be connected to the selected client.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <span className="rounded-full bg-white px-4 py-2 text-sm font-medium text-[#5f5246]">
            <MessageSquare className="mr-2 inline" size={16} />
            WhatsApp .zip
          </span>
          <span className="rounded-full bg-white px-4 py-2 text-sm font-medium text-[#5f5246]">
            <Mic className="mr-2 inline" size={16} />
            Voice note
          </span>
          <span className="rounded-full bg-white px-4 py-2 text-sm font-medium text-[#5f5246]">
            <Image className="mr-2 inline" size={16} />
            Screenshot
          </span>
        </div>

        <button className="btn-primary mt-8">Choose files</button>
      </div>

      <textarea
        placeholder="Or paste client messages here..."
        className="mt-6 min-h-40 w-full rounded-3xl border border-[#e8dccd] bg-[#fffaf2] p-5 text-[#2a2118] outline-none placeholder:text-[#a4998d]"
      />

      <div className="mt-6 flex justify-end gap-3">
        <button className="btn-secondary">Save draft</button>
        <button className="btn-primary">Generate brief</button>
      </div>
    </div>
  );
}