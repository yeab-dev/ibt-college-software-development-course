import { useState } from "react";

function DeliveryForm() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    area: "",
  });

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  // Basic Ethiopian mobile number validation.
  const isValidPhone =
    /^(?:\+251|251|0)?9\d{8}$/.test(
      form.phone.replace(/\s/g, "")
    );

  function handleSubmit(event) {
    event.preventDefault();

    if (!isValidPhone) return;

    console.log("Delivery details:", form);
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Delivery Details</h2>

      <input
        type="text"
        name="name"
        placeholder="Your name"
        value={form.name}
        onChange={handleChange}
      />

      <input
        type="tel"
        name="phone"
        placeholder="TeleBirr phone number"
        value={form.phone}
        onChange={handleChange}
      />

      <input
        type="text"
        name="area"
        placeholder="Delivery area"
        value={form.area}
        onChange={handleChange}
      />

      {!isValidPhone && form.phone && (
        <p>
          Enter a valid Ethiopian mobile number.
        </p>
      )}

      <button
        type="submit"
        disabled={!isValidPhone}
      >
        Pay with TeleBirr
      </button>
    </form>
  );
}

export default DeliveryForm;