"""LLM service - wraps Gemini with retries + offline fallback."""
from __future__ import annotations

import re

from tenacity import retry, stop_after_attempt, wait_exponential

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.schema import HumanMessage, SystemMessage

from app.core.config import settings


def _build_llm():
    return ChatGoogleGenerativeAI(
        model=settings.gemini_model,
        google_api_key=settings.google_api_key,
        temperature=0.4,
        top_p=0.95,
        max_output_tokens=2048,
        convert_system_message_to_human=True,
    )


@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=8))
async def _generate_with_gemini(system: str, user: str) -> str:
    llm = _build_llm()
    res = await llm.ainvoke(
        [SystemMessage(content=system), HumanMessage(content=user)]
    )
    return res.content or ""


async def generate(system: str, user: str) -> str:
    if not settings.google_api_key or settings.offline_mode:
        return _offline_answer(user)

    try:
        return await _generate_with_gemini(system, user)
    except Exception:
        return _offline_answer(user)


def _offline_answer(user: str) -> str:
    """Fallback answer used when Gemini is unavailable.

    This keeps the chat usable in local/demo mode. It is not a replacement for
    Gemini, but it gives students a clean exam-style answer instead of an error.
    """
    question = _extract_prompt_value(user, "QUESTION") or "the topic"
    subject = _extract_prompt_value(user, "SUBJECT") or "the selected subject"
    marks = _extract_prompt_value(user, "MARKS BUDGET") or "5marks"
    topic = _clean_topic(question)
    short = "2marks" in marks or "5marks" in marks

    if "information technology" in topic.lower():
        return _information_technology_answer(short)

    if "compiler" in topic.lower() and "interpreter" in topic.lower():
        return _compiler_interpreter_answer(short)

    if "compiler" in topic.lower():
        return _compiler_answer(short)

    if "interpreter" in topic.lower():
        return _interpreter_answer(short)

    if "computer network" in topic.lower() or "computer networks" in topic.lower():
        return _computer_network_answer(short)

    if "switch" in topic.lower():
        return _switch_answer(short)

    if "router" in topic.lower():
        return _router_answer(short)

    if "hub" in topic.lower():
        return _hub_answer(short)

    if "bridge" in topic.lower():
        return _bridge_answer(short)

    if "lan" in topic.lower():
        return _lan_answer(short)

    if "wan" in topic.lower():
        return _wan_answer(short)

    if "ip address" in topic.lower() or topic.lower() == "ip":
        return _ip_address_answer(short)

    if "dns" in topic.lower():
        return _dns_answer(short)

    if "osi" in topic.lower():
        return _osi_model_answer(short)

    if "information security" in topic.lower() or "security" in topic.lower():
        return _information_security_answer(topic, short)

    return _general_answer(topic, subject, short)


def _extract_prompt_value(prompt: str, label: str) -> str:
    pattern = rf"{re.escape(label)}:\s*(.*?)(?:\n\n|$)"
    match = re.search(pattern, prompt, re.DOTALL | re.IGNORECASE)
    return match.group(1).strip() if match else ""


def _clean_topic(question: str) -> str:
    text = question.strip()
    text = re.sub(
        r"^(what is|define|explain|write about|describe)\s+",
        "",
        text,
        flags=re.I,
    )
    text = text.strip(" ?.!:")
    return text or question.strip() or "the topic"


def _information_technology_answer(short: bool) -> str:
    if short:
        return (
            "Information Technology, or IT, is the use of computers, software, "
            "networks, databases, and communication systems to store, process, "
            "protect, and share information.\n\n"
            "It is used in almost every field today, such as banking, education, "
            "healthcare, business, government services, websites, mobile apps, "
            "and cloud platforms. The main purpose of IT is to make data handling "
            "faster, easier, safer, and more accurate."
        )

    return (
        "Information Technology, usually called IT, refers to the use of computer systems, "
        "software, networks, databases, and communication technologies to create, "
        "store, process, secure, and exchange information. In simple words, IT "
        "helps people and organizations manage data efficiently.\n\n"
        "The major components of IT include hardware, software, networks, databases, "
        "and security systems. Hardware includes computers, servers, storage devices, "
        "and routers. Software includes operating systems and applications. Networks "
        "allow devices to communicate, while databases store and organize information.\n\n"
        "IT is important because it improves speed, accuracy, automation, communication, "
        "and decision-making. Examples include online banking, e-learning platforms, "
        "hospital management systems, cloud computing, mobile applications, and "
        "e-commerce websites."
    )


def _information_security_answer(topic: str, short: bool) -> str:
    if short:
        return (
            "Information Security is the practice of protecting data and computer "
            "systems from unauthorized access, misuse, modification, disclosure, "
            "or destruction.\n\n"
            "It mainly focuses on the CIA triad: confidentiality, integrity, and "
            "availability. Confidentiality ensures only authorized users can access "
            "data. Integrity ensures data remains correct. Availability ensures "
            "systems and data are available when needed."
        )

    return (
        "Information Security is the practice of protecting information and "
        "information systems from unauthorized access, misuse, modification, "
        "disclosure, disruption, or destruction. Its main goal is to keep data "
        "safe and reliable.\n\n"
        "The three main principles of information security are confidentiality, "
        "integrity, and availability. Confidentiality means only authorized people "
        "can access the data. Integrity means the data should remain accurate and "
        "unchanged. Availability means the system and data should be accessible "
        "whenever required.\n\n"
        "Common security measures include passwords, multi-factor authentication, "
        "encryption, firewalls, access control, backups, and security policies. "
        "Information Security is important in banking, healthcare, education, "
        "business, and government because it protects privacy, prevents data loss, "
        "and maintains trust in digital systems."
    )


def _compiler_interpreter_answer(short: bool) -> str:
    if short:
        return (
            "A compiler and an interpreter are both language translators, but they "
            "work differently.\n\n"
            "| Compiler | Interpreter |\n"
            "|---|---|\n"
            "| Translates the whole program at once. | Translates and executes line by line. |\n"
            "| Generates object/executable code. | Usually does not generate separate object code. |\n"
            "| Errors are shown after compilation. | Errors are shown immediately line by line. |\n"
            "| Execution is faster after compilation. | Execution is slower because translation happens during runtime. |\n\n"
            "For example, C and C++ usually use compilers, while Python and JavaScript "
            "commonly use interpreters."
        )

    return (
        "A **compiler** and an **interpreter** are language translators. They convert "
        "a high-level program into machine-understandable form, but they work in "
        "different ways.\n\n"
        "| Basis | Compiler | Interpreter |\n"
        "|---|---|---|\n"
        "| Translation | Translates the entire program at once. | Translates one statement at a time. |\n"
        "| Execution | Program runs after successful compilation. | Program runs while translation is happening. |\n"
        "| Object code | Produces object or executable code. | Usually does not produce separate object code. |\n"
        "| Error detection | Shows errors after checking the whole program. | Stops and shows error at the current line. |\n"
        "| Speed | Faster during execution. | Slower during execution. |\n"
        "| Memory | Requires more memory for object code. | Requires less memory. |\n"
        "| Examples | C, C++, Java compilation stage. | Python, JavaScript, Ruby. |\n\n"
        "A compiler is preferred when fast execution is needed, while an interpreter "
        "is useful for easy debugging and interactive program execution."
    )


def _compiler_answer(short: bool) -> str:
    if short:
        return (
            "A **compiler** is a translator program that converts an entire "
            "high-level language program into machine code or object code before "
            "execution.\n\n"
            "After compilation, the program can run faster because the translation "
            "is already completed. Examples of compiled languages include C and C++."
        )

    return (
        "A **compiler** is a system software that translates a complete program "
        "written in a high-level programming language into machine code or object "
        "code before execution.\n\n"
        "The compiler checks the whole program, detects errors, and if the program "
        "is correct, produces an executable or object file. Since translation is "
        "done before execution, compiled programs usually run faster.\n\n"
        "For example, in C or C++, the source code is first compiled. If there are "
        "syntax errors, the compiler reports them. After successful compilation, "
        "the generated executable file can be run many times without compiling again.\n\n"
        "So, a compiler is important because it converts human-readable code into "
        "machine-understandable code and improves execution speed."
    )


def _interpreter_answer(short: bool) -> str:
    if short:
        return (
            "An **interpreter** is a translator program that converts and executes "
            "a high-level language program line by line.\n\n"
            "It does not usually create a separate executable file. If an error is "
            "found, execution stops at that line. Python and JavaScript commonly use interpreters."
        )

    return (
        "An **interpreter** is a language translator that reads, translates, and "
        "executes a program one statement at a time.\n\n"
        "Unlike a compiler, an interpreter does not translate the whole program at "
        "once. It executes each line directly. If an error occurs, it stops at that "
        "line and shows the error, which makes debugging easier.\n\n"
        "Interpreters are commonly used in languages such as Python, JavaScript, "
        "Ruby, and PHP. They are useful for interactive programming and testing, "
        "but execution can be slower because translation happens during runtime."
    )


def _computer_network_answer(short: bool) -> str:
    if short:
        return (
            "A **computer network** is a group of computers and other devices "
            "connected together so they can share data, resources, and services.\n\n"
            "For example, computers in a college lab may be connected through a "
            "network to share files, printers, internet access, and applications. "
            "Common examples of computer networks are LAN, WAN, Wi-Fi networks, "
            "and the Internet."
        )

    return (
        "A **computer network** is a collection of computers, servers, mobile "
        "devices, routers, switches, and other devices connected together for "
        "communication and resource sharing.\n\n"
        "The main purpose of a computer network is to allow users and devices to "
        "exchange data easily. Through a network, users can share files, printers, "
        "internet connections, databases, applications, and other resources.\n\n"
        "**Example:** In a college computer lab, many systems may be connected "
        "through a LAN. Students can access the internet, share files, use common "
        "software, and print documents through the same network.\n\n"
        "Computer networks are commonly classified as **LAN**, **MAN**, and **WAN**. "
        "A LAN covers a small area such as a room, building, or campus. A MAN covers "
        "a city or large organization. A WAN covers a very large geographical area; "
        "the Internet is the best example of a WAN.\n\n"
        "Computer networks are important because they make communication faster, "
        "reduce cost by sharing resources, support centralized data management, "
        "and allow remote access to information and services."
    )


def _switch_answer(short: bool) -> str:
    if short:
        return (
            "A **switch** is a networking device used to connect multiple devices "
            "within a local area network (LAN).\n\n"
            "It receives data frames and forwards them only to the device for which "
            "they are intended, using MAC addresses. This reduces unnecessary traffic "
            "and makes communication more efficient than a hub."
        )

    return (
        "A **switch** is a network device that connects multiple computers or devices "
        "in a local area network (LAN). It works mainly at the Data Link Layer of "
        "the OSI model.\n\n"
        "When a switch receives a data frame, it checks the destination MAC address "
        "and forwards the frame only to the correct port. Because of this, a switch "
        "reduces unnecessary traffic and improves network performance.\n\n"
        "For example, in a computer lab, all computers may be connected to a switch. "
        "If one computer sends data to another, the switch sends that data only to "
        "the destination computer instead of broadcasting it to every system.\n\n"
        "Switches are important because they provide faster communication, reduce "
        "collisions, support full-duplex communication, and make LANs more efficient."
    )


def _router_answer(short: bool) -> str:
    if short:
        return (
            "A **router** is a networking device that connects different networks "
            "and forwards data packets between them.\n\n"
            "It uses IP addresses to choose the best path for data transmission. "
            "For example, a home Wi-Fi router connects your local network to the Internet."
        )

    return (
        "A **router** is a networking device used to connect two or more different "
        "networks. It forwards data packets from one network to another using IP addresses.\n\n"
        "Routers work mainly at the Network Layer of the OSI model. When data reaches "
        "a router, it checks the destination IP address and decides the best path "
        "for forwarding the packet.\n\n"
        "A common example is a home Wi-Fi router. It connects mobile phones, laptops, "
        "and computers in the home network to the Internet.\n\n"
        "Routers are important because they enable Internet connectivity, select "
        "efficient paths, separate networks, and help manage traffic between networks."
    )


def _hub_answer(short: bool) -> str:
    return (
        "A **hub** is a basic networking device used to connect multiple devices "
        "in a LAN.\n\n"
        "When a hub receives data from one device, it sends the data to all connected "
        "devices, whether they need it or not. Because of this, hubs create more "
        "network traffic and are less efficient than switches."
    )


def _bridge_answer(short: bool) -> str:
    return (
        "A **bridge** is a networking device used to connect two network segments "
        "and control traffic between them.\n\n"
        "It uses MAC addresses to decide whether data should be forwarded or filtered. "
        "A bridge helps reduce unnecessary traffic and divides a large network into "
        "smaller, more manageable segments."
    )


def _lan_answer(short: bool) -> str:
    return (
        "A **LAN (Local Area Network)** is a network that connects computers and "
        "devices within a small area such as a room, building, school, college, or office.\n\n"
        "LANs are usually fast, privately owned, and commonly use Ethernet or Wi-Fi. "
        "They are used to share files, printers, internet access, and applications."
    )


def _wan_answer(short: bool) -> str:
    return (
        "A **WAN (Wide Area Network)** is a network that connects computers and "
        "networks over a large geographical area such as cities, countries, or continents.\n\n"
        "The best example of a WAN is the Internet. WANs are used to connect branch "
        "offices, remote users, and large organizations across long distances."
    )


def _ip_address_answer(short: bool) -> str:
    return (
        "An **IP address** is a unique numerical address assigned to a device on a "
        "network. It is used to identify the device and send data to the correct destination.\n\n"
        "For example, when your computer communicates on the Internet, its IP address "
        "helps routers deliver packets to and from the correct system. IP addresses "
        "can be IPv4, such as 192.168.1.1, or IPv6."
    )


def _dns_answer(short: bool) -> str:
    return (
        "**DNS (Domain Name System)** is a system that converts domain names into "
        "IP addresses.\n\n"
        "Humans use names like google.com, but computers communicate using IP "
        "addresses. DNS works like a phone book for the Internet by finding the IP "
        "address of a website so the browser can connect to it."
    )


def _osi_model_answer(short: bool) -> str:
    return (
        "The **OSI model** is a reference model that explains how data communication "
        "happens between computers in a network. It has seven layers:\n\n"
        "1. Physical Layer\n"
        "2. Data Link Layer\n"
        "3. Network Layer\n"
        "4. Transport Layer\n"
        "5. Session Layer\n"
        "6. Presentation Layer\n"
        "7. Application Layer\n\n"
        "Each layer performs a specific function and helps standardize network communication."
    )


def _general_answer(topic: str, subject: str, short: bool) -> str:
    if short:
        return (
            f"**{topic.title()}** is a concept related to {subject}. It describes "
            "a specific idea, method, or process used to solve problems or explain "
            "how a system works.\n\n"
            "It is important because it helps understand the subject clearly and "
            "is often used in practical applications."
        )

    return (
        f"**{topic.title()}** is an important concept in {subject}. It refers to "
        "a particular idea, technique, or process that helps explain how something "
        "works in the subject.\n\n"
        "It is mainly used to understand the working, features, advantages, and "
        "applications of a system or method. In practical use, it helps solve "
        "problems, improve efficiency, and organize information in a clear way.\n\n"
        "For example, when studying {subject}, this concept can be connected with "
        "real-world systems, applications, or processes. Understanding it helps "
        "students answer theory questions, compare related concepts, and apply the "
        "idea in practical situations."
    )


_TOPIC_HINTS = {
    "deadlocks", "paging", "scheduling", "virtual memory", "thrashing",
    "semaphores", "mutex", "process synchronization", "file systems",
    "normalization", "indexing", "transactions", "sql", "joins",
    "deadlock", "compiler", "parsing", "lexical analysis", "syntax tree",
    "interrupts", "memory management", "cache", "tcp", "udp", "routing",
    "encryption", "authentication", "neural networks", "gradient descent",
    "backpropagation", "clustering", "regression", "linked list", "tree",
    "graph", "sorting", "searching", "hashing", "recursion", "dp",
    "dynamic programming", "greedy", "information technology",
    "information security", "confidentiality", "integrity", "availability",
}


def extract_confidence(answer: str) -> list[dict]:
    text = answer.lower()
    found = []
    for t in _TOPIC_HINTS:
        if t in text:
            found.append({"topic": t.title(), "score": 90 - len(found) * 7})
    return found[:8]
