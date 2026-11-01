customers = [("Almaz", 1500), ("Dawit", 700),  ("Tigist", 200)]

for name, balance in customers:
    if balance >= 1000:
        tier = "Prremium"
    elif balance >= 500:
        tier = "Standard"
    else:
        tier = "Basic"

    print(f"{name}: {tier} ({balance} ETB)")