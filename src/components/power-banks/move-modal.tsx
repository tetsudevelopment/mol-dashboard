"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/input";
import { ErrorBanner } from "@/components/ui/error-banner";
import { useMovePowerBank } from "@/queries/admin-power-banks.queries";
import type { PowerBank } from "@/validators/power-bank.schema";
import {
  MAX_POWER_BANKS_PER_STATION,
  isStationFull,
  type Station,
} from "@/validators/station.schema";

export function MovePowerBankModal({
  powerBank,
  stations,
  open,
  onClose,
}: {
  powerBank: PowerBank | null;
  stations: Station[];
  open: boolean;
  onClose: () => void;
}) {
  const [targetStation, setTargetStation] = useState("");
  const move = useMovePowerBank();

  async function handleSubmit() {
    if (!powerBank || !targetStation) return;
    await move.mutateAsync({ id: powerBank.id, input: { station_id: targetStation } });
    setTargetStation("");
    onClose();
  }

  function handleClose() {
    move.reset();
    setTargetStation("");
    onClose();
  }

  const otherStations = stations.filter((s) => s.id !== powerBank?.station_id);

  return (
    <Modal open={open} onClose={handleClose} title="Mover batería de gabinete" width="md">
      {powerBank ? (
        <div className="space-y-3">
          <div className="rounded-md bg-zinc-50 px-3 py-2 text-xs dark:bg-zinc-950">
            <div className="font-mono font-medium">{powerBank.code}</div>
            <div className="text-zinc-500">
              Gabinete actual:{" "}
              <span className="font-mono">
                {stations.find((s) => s.id === powerBank.station_id)?.name ?? powerBank.station_id}
              </span>
            </div>
            <div className="mt-1 text-zinc-500">Status: {powerBank.status}</div>
          </div>

          {powerBank.status === "rented" ? (
            <div
              role="alert"
              data-testid="move-blocked-rented"
              className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-300"
            >
              Esta batería está alquilada. El back va a rechazar el movimiento — primero hay
              que esperar la devolución.
            </div>
          ) : null}

          {otherStations.every(isStationFull) && otherStations.length > 0 ? (
            <div
              role="alert"
              data-testid="move-no-room"
              className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950 dark:text-red-300"
            >
              Todos los demás gabinetes están llenos ({String(MAX_POWER_BANKS_PER_STATION)}/
              {String(MAX_POWER_BANKS_PER_STATION)}). Mové o retirá una batería de algún
              gabinete antes de poder mover ésta.
            </div>
          ) : null}

          <Field
            label="Mover a"
            htmlFor="target_station"
            hint={`Máximo ${String(MAX_POWER_BANKS_PER_STATION)} baterías por gabinete. Los marcados como LLENO no se pueden seleccionar.`}
          >
            <Select
              id="target_station"
              data-testid="move-target-station"
              value={targetStation}
              onChange={(e) => setTargetStation(e.target.value)}
            >
              <option value="">Seleccionar gabinete destino…</option>
              {otherStations.map((s) => {
                const full = isStationFull(s);
                return (
                  <option key={s.id} value={s.id} disabled={full}>
                    {s.name} — {s.city} ({s.power_banks_count}/
                    {MAX_POWER_BANKS_PER_STATION}
                    {full ? " · LLENO" : ""})
                  </option>
                );
              })}
            </Select>
          </Field>

          <ErrorBanner error={move.error} testId="move-error" />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={handleClose} disabled={move.isPending}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={!targetStation || move.isPending}
              data-testid="move-confirm"
            >
              {move.isPending ? "Moviendo…" : "Mover"}
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
