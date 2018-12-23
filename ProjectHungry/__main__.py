import random
import math
import sys

NAMES = {
    "female": ["Kamari", "Victoria", "Isabelle", "Amani", "Mariam", "Tania", "Maggie", "Alisha", "Saige", "Kayley", "Evelyn", "Shirley"],
    "male": ["Jaidyn", "Francisco", "Yurem", "Karson", "Tomas", "Lamar", "Immanuel", "Edward", "Mario", "Damion", "Aedan", "Louis" ]
}

WEAPONS = {
    "knife": {"damage": 3, "speed": 10},
    "axe": {"damage": 8, "speed": 3}
}

all_objects = []

def createObject(type, name):
    object = {
        "id": len(all_objects),
        "type": type,
        "name": name
    }
    all_objects.append(object)
    return object


def createContainer(name):
    object = createObject("container", name)
    object["contents"] = []
    return object


def createWeapon(name, damage, speed):
    object = createObject("weapon", name)
    object["damage"] = damage
    object["speed"] = speed
    return object


all_tributes = []
alive_tributes = []
dead_tributes = []

def createTribute(district, gender):
    tribute = createObject("tribute", NAMES[gender][random.randint(0, len(NAMES[gender]) - 1)])
    tribute["inventory"] = []
    tribute["district"] = district
    tribute["gender"] = gender
    tribute["name"] = NAMES[gender][random.randint(0, len(NAMES[gender]) - 1)]
    tribute["health"] = 100
    tribute["strength"] = random.randint(1, 10)
    tribute["agility"] = random.randint(1, 10)
    tribute["x"] = 0
    tribute["y"] = 0
    return tribute


for district in range(1, 13):
    all_tributes.append(createTribute(str(district), "male"))
    all_tributes.append(createTribute(str(district), "female"))


def getObject(id):
    for object in all_objects:
        if object["id"] == id:
            return object

def createLocation(x, y):
    location = {
        "x": x,
        "y": y,
        "north": None,
        "east": None,
        "south": None,
        "west": None,
        "tributes": [],
        "objects": []
    }
    return location


def moveTribute(tribute, arena, dx, dy):
    arena["locations"][tribute["x"]][tribute["y"]]["tributes"].remove(tribute["id"])
    tribute["x"] += dx
    tribute["y"] += dy
    arena["locations"][tribute["x"]][tribute["y"]]["tributes"].append(tribute["id"])


def createArena(size):
    arena = {
        "size": size,
        "locations": []
    }
    locations = arena["locations"]
    for x in range(0, size):
        locations.append([])
        for y in range(0, size):
            locations[x].append(createLocation(x, y))
    for x in range(0, size):
        for y in range(0, size):
            location = locations[x][y]
            if x > 0:
                location["west"] = locations[x-1][y]
            if x < size - 1:
                location["east"] = locations[x+1][y]
            if y > 0:
                location["north"] = locations[x][y-1]
            if y < size - 1:
                location["south"] = locations[x][y+1]

    alive_tributes.clear()
    dead_tributes.clear()
    
    cornucopia = createContainer("Cornucopia")
    for name in WEAPONS:
        weapon = createWeapon(name, WEAPONS[name]["damage"], WEAPONS[name]["speed"])
        cornucopia["contents"].append(weapon["id"])
    
    middle = math.floor( size / 2 )
    locations[middle][middle]["objects"].append(cornucopia["id"])
    for tribute in all_tributes:
        alive_tributes.append(tribute)
        tribute["x"] = middle
        tribute["y"] = middle
        locations[middle][middle]["tributes"].append(tribute["id"])
    return arena


def tributesSummary():
    print("#  | Name       | Gender | District | Strength | Agility")
    print("--------------------------------------------------------")
    choice = 0
    for tribute in arena["tributes"]:
        choice = choice + 1
        print('{: <2} | {: <10} | {: ^6} |    D{: <2}   |    {: <2}   |    {: <2}'.format(choice, tribute["name"], tribute["gender"], tribute["district"], tribute["strength"], tribute["agility"]))


def pickPlayerTribute():
    default = str(random.randint(1, 12))
    district = input("Play as a tribute from district [1-12]({}): ".format(default))
    if not district:
        district = default
    
    choices = []
    for tribute in all_tributes:
        if tribute["district"] == district:
            choices.append(tribute)
            print('[{: <2}] {}'.format(len(choices), tributeInfo(tribute)))

    default = str(random.randint(1, 2))
    choice = input("Play as tribute [1-2]({}): ".format(default))
    if not choice:
        choice = default
    tribute = choices[int(choice) - 1]

    name = input("Change your name ({}): ".format(tribute["name"]))
    if not name:
        name = tribute["name"]
    tribute["name"] = name

    strength = input("Change your strength ({}): ".format(tribute["strength"]))
    if not strength:
        strength = str(tribute["strength"])
    tribute["strength"] = int(strength)

    agility = input("Change your agility ({}): ".format(tribute["agility"]))
    if not agility:
        agility = str(tribute["agility"])
    tribute["agility"] = int(agility)

    print("Playing as {}".format(tributeInfo(tribute)))
    return tribute


def locationSummary(location):
    print("There are {} tributes in this location.".format(len(location["tributes"])))
    print(location["description"])


def tributeInfo(tribute):
    return '{: <10} (district {: >2} {: <6}) [str:{: >2}, agi:{: >2}]'.format(tribute["name"], tribute["district"], tribute["gender"], tribute["strength"], tribute["agility"])

def objectInfo(object):
    return '{: <10} {: <10}'.format(object["type"], object["name"])

def main():
    player = pickPlayerTribute()
    arena = createArena(3)
    while player["health"] > 0 and len(alive_tributes) > 1:
        location = arena["locations"][player["x"]][player["y"]]
        print("{} tributes at this location:".format(len(location["tributes"])))
        for tributeid in location["tributes"]:
            tribute = getObject(tributeid)
            indent = "      "
            if tribute == player:
                indent = "(you) "
            print(indent + tributeInfo(tribute))
        print("{} objects at this location:".format(len(location["objects"])))
        for objectid in location["objects"]:
            object = getObject(objectid)
            indent = "      "
            print(indent + objectInfo(object))
        
        choices = []

        def action():
            sys.exit(0)
        choices.append([0, "Quit", action])

        def action():
            return
        choices.append([len(choices), "Rest", action])

        if location["north"]:
            def action():
                print("You go north")
                moveTribute(player, arena, 0, -1)
            choices.append([len(choices), "Go north", action])

        if location["east"]:
            def action():
                print("You go east")
                moveTribute(player, arena, 1, 0)
            choices.append([len(choices), "Go east", action])

        if location["south"]:
            def action():
                print("You go south")
                moveTribute(player, arena, 0, 1)
            choices.append([len(choices), "Go south", action])

        if location["west"]:
            def action():
                print("You go west")
                moveTribute(player, arena, -1, 0)
            choices.append([len(choices), "Go west", action])

        for choice in choices:
            print("[{: <2}]".format(choice[0]), choice[1])
        
        choice = input("(1-{})[1]: ".format(len(choices)))
        if not choice:
            choice = "1"
        
        choices[int(choice)][2]()


if __name__== "__main__":
    main()