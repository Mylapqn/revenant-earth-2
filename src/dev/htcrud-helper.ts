export function htcrudSave(name: string, data: any) {
    fetch(`${name}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
}

export async function htcrudLoad(name: string) {
    const res = await fetch(`${name}`);
    return await res.json();
}