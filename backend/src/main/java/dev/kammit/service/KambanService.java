package dev.kammit.service;

import java.util.NoSuchElementException;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import dev.kammit.model.Board;
import dev.kammit.model.BoardColumn;
import dev.kammit.model.Card;
import dev.kammit.repository.BoardColumnRepository;
import dev.kammit.repository.BoardRepository;
import dev.kammit.repository.CardRepository;

@Service
public class KambanService {

    public static final String MAIN_BOARD_NAME = "KAMban";

    private final BoardRepository boardRepository;
    private final BoardColumnRepository boardColumnRepository;
    private final CardRepository cardRepository;

    public KambanService(
            BoardRepository boardRepository,
            BoardColumnRepository boardColumnRepository,
            CardRepository cardRepository) {
        this.boardRepository = boardRepository;
        this.boardColumnRepository = boardColumnRepository;
        this.cardRepository = cardRepository;
    }

    /**
     * Single shared board for the whole site — get existing KAMban or create it once.
     */
    @Transactional
    public synchronized Board getMainBoard() {
        return boardRepository.findFirstByNameIgnoreCaseOrderByIdAsc(MAIN_BOARD_NAME)
                .orElseGet(() -> {
                    Board board = new Board();
                    board.setName(MAIN_BOARD_NAME);
                    return createBoardWithDefaults(board);
                });
    }

    private Board createBoardWithDefaults(Board board) {
        BoardColumn todo = new BoardColumn();
        todo.setTitle("To-Do ｡˚🐈‍⬛.𖥔 ݁ ˖");
        todo.setPosition(0);
        todo.setBoard(board);

        BoardColumn doing = new BoardColumn();
        doing.setTitle("Doing (be patient damn) ‧₊˚🖇️✩ ₊˚🎧⊹♡📷");
        doing.setPosition(1);
        doing.setBoard(board);

        BoardColumn done = new BoardColumn();
        done.setTitle("Done (you're welcome?) ༘⋆📼˚ ༘ ೀ⋆｡˚");
        done.setPosition(2);
        done.setBoard(board);

        board.getColumns().add(todo);
        board.getColumns().add(doing);
        board.getColumns().add(done);

        return boardRepository.save(board);
    }

    public Card createCard(Long columnId, Card card) {
        BoardColumn column = boardColumnRepository.findById(columnId)
                .orElseThrow(() -> new NoSuchElementException("Column not found: " + columnId));
        card.setBoardColumn(column);
        card.setPosition(column.getCards().size());
        return cardRepository.save(card);
    }

    public Card updateCard(Long cardId, Card updatedCard) {
        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new NoSuchElementException("Card not found: " + cardId));
        if (updatedCard.getTitle() != null) card.setTitle(updatedCard.getTitle());
        if (updatedCard.getDescription() != null) card.setDescription(updatedCard.getDescription());
        return cardRepository.save(card);
    }

    public Card moveCard(Long cardId, Long newColumnId, int newPosition) {
        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new NoSuchElementException("Card not found: " + cardId));
        BoardColumn newColumn = boardColumnRepository.findById(newColumnId)
                .orElseThrow(() -> new NoSuchElementException("Column not found: " + newColumnId));
        card.setBoardColumn(newColumn);
        card.setPosition(newPosition);
        return cardRepository.save(card);
    }

    public void deleteCard(Long cardId) {
        if (!cardRepository.existsById(cardId)) {
            throw new NoSuchElementException("Card not found: " + cardId);
        }
        cardRepository.deleteById(cardId);
    }
}
