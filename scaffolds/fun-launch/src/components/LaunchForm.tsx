const [useVanitySuffix, setUseVanitySuffix] = useState(false);
const [vanitySuffix, setVanitySuffix] = useState("");

<label>
  <input
    type="checkbox"
    checked={useVanitySuffix}
    onChange={() => setUseVanitySuffix(!useVanitySuffix)}
  />
  Use Vanity Suffix
</label>

{useVanitySuffix && (
  <input
    placeholder="Desired suffix (e.g. XYZ)"
    value={vanitySuffix}
    onChange={(e) => setVanitySuffix(e.target.value)}
  />
)}

await launchToken({
  vanitySuffix: useVanitySuffix ? vanitySuffix : undefined
});
