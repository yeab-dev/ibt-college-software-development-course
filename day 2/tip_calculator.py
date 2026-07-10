bill_total = 3000
number_of_people = 5
names = ["Girum", "Betty", "Helen", "Abera", "Solomon"]

def split_bill(total, people, tip_rate=0.10):
    tip = total * tip_rate
    total_with_tip = total + tip
    per_person = total_with_tip / people

    return per_person

share = split_bill(bill_total, number_of_people)

for name in names:
    print(f"{name} pays {share:.2f} ETB")